/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals Cmd, DeviceCmykCS, Dict, globalScope, INFOS, MozBlobBuilder, Name,
           PDFJS, Ref, WARNINGS, verbosity */

'use strict';

// Use only for debugging purposes. This should not be used in any code that is
// in mozilla master.
var log = (function() {
  if ('console' in globalScope && 'log' in globalScope['console']) {
    return globalScope['console']['log'].bind(globalScope['console']);
  } else {
    return function nop() {
    };
  }
})();

// A notice for devs that will not trigger the fallback UI.  These are good
// for things that are helpful to devs, such as warning that Workers were
// disabled, which is important to devs but not end users.
function info(msg) {
  if (verbosity >= INFOS) {
    log('Info: ' + msg);
    PDFJS.LogManager.notify('info', msg);
  }
}

// Non-fatal warnings that should trigger the fallback UI.
function warn(msg) {
  if (verbosity >= WARNINGS) {
    log('Warning: ' + msg);
    PDFJS.LogManager.notify('warn', msg);
  }
}

// Fatal errors that should trigger the fallback UI and halt execution by
// throwing an exception.
function error(msg) {
  // If multiple arguments were passed, pass them all to the log function.
  if (arguments.length > 1) {
    var logArguments = ['Error:'];
    logArguments.push.apply(logArguments, arguments);
    log.apply(null, logArguments);
    // Join the arguments into a single string for the lines below.
    msg = [].join.call(arguments, ' ');
  } else {
    log('Error: ' + msg);
  }
  log(backtrace());
  PDFJS.LogManager.notify('error', msg);
  throw new Error(msg);
}

// Missing features that should trigger the fallback UI.
function TODO(what) {
  warn('TODO: ' + what);
}

function backtrace() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack ? e.stack.split('\n').slice(2).join('\n') : '';
  }
}

function assert(cond, msg) {
  if (!cond)
    error(msg);
}

// Combines two URLs. The baseUrl shall be absolute URL. If the url is an
// absolute URL, it will be returned as is.
function combineUrl(baseUrl, url) {
  if (!url)
    return baseUrl;
  if (url.indexOf(':') >= 0)
    return url;
  if (url.charAt(0) == '/') {
    // absolute path
    var i = baseUrl.indexOf('://');
    i = baseUrl.indexOf('/', i + 3);
    return baseUrl.substring(0, i) + url;
  } else {
    // relative path
    var pathLength = baseUrl.length, i;
    i = baseUrl.lastIndexOf('#');
    pathLength = i >= 0 ? i : pathLength;
    i = baseUrl.lastIndexOf('?', pathLength);
    pathLength = i >= 0 ? i : pathLength;
    var prefixLength = baseUrl.lastIndexOf('/', pathLength);
    return baseUrl.substring(0, prefixLength + 1) + url;
  }
}

// In a well-formed PDF, |cond| holds.  If it doesn't, subsequent
// behavior is undefined.
function assertWellFormed(cond, msg) {
  if (!cond)
    error(msg);
}

var LogManager = PDFJS.LogManager = (function LogManagerClosure() {
  var loggers = [];
  return {
    addLogger: function logManager_addLogger(logger) {
      loggers.push(logger);
    },
    notify: function(type, message) {
      for (var i = 0, ii = loggers.length; i < ii; i++) {
        var logger = loggers[i];
        if (logger[type])
          logger[type](message);
      }
    }
  };
})();

function shadow(obj, prop, value) {
  Object.defineProperty(obj, prop, { value: value,
                                     enumerable: true,
                                     configurable: true,
                                     writable: false });
  return value;
}

var PasswordException = (function PasswordExceptionClosure() {
  function PasswordException(msg, code) {
    this.name = 'PasswordException';
    this.message = msg;
    this.code = code;
  }

  PasswordException.prototype = new Error();
  PasswordException.constructor = PasswordException;

  return PasswordException;
})();

var UnknownErrorException = (function UnknownErrorExceptionClosure() {
  function UnknownErrorException(msg, details) {
    this.name = 'UnknownErrorException';
    this.message = msg;
    this.details = details;
  }

  UnknownErrorException.prototype = new Error();
  UnknownErrorException.constructor = UnknownErrorException;

  return UnknownErrorException;
})();

var InvalidPDFException = (function InvalidPDFExceptionClosure() {
  function InvalidPDFException(msg) {
    this.name = 'InvalidPDFException';
    this.message = msg;
  }

  InvalidPDFException.prototype = new Error();
  InvalidPDFException.constructor = InvalidPDFException;

  return InvalidPDFException;
})();

var MissingPDFException = (function MissingPDFExceptionClosure() {
  function MissingPDFException(msg) {
    this.name = 'MissingPDFException';
    this.message = msg;
  }

  MissingPDFException.prototype = new Error();
  MissingPDFException.constructor = MissingPDFException;

  return MissingPDFException;
})();

var NotImplementedException = (function NotImplementedExceptionClosure() {
  function NotImplementedException(msg) {
    this.message = msg;
  }

  NotImplementedException.prototype = new Error();
  NotImplementedException.prototype.name = 'NotImplementedException';
  NotImplementedException.constructor = NotImplementedException;

  return NotImplementedException;
})();

var MissingDataException = (function MissingDataExceptionClosure() {
  function MissingDataException(begin, end) {
    this.begin = begin;
    this.end = end;
    this.message = 'Missing data [begin, end)';
  }

  MissingDataException.prototype = new Error();
  MissingDataException.prototype.name = 'MissingDataException';
  MissingDataException.constructor = MissingDataException;

  return MissingDataException;
})();

var XRefParseException = (function XRefParseExceptionClosure() {
  function XRefParseException(msg) {
    this.message = msg;
  }

  XRefParseException.prototype = new Error();
  XRefParseException.prototype.name = 'XRefParseException';
  XRefParseException.constructor = XRefParseException;

  return XRefParseException;
})();


function bytesToString(bytes) {
  var str = '';
  var length = bytes.length;
  for (var n = 0; n < length; ++n)
    str += String.fromCharCode(bytes[n]);
  return str;
}

function stringToBytes(str) {
  var length = str.length;
  var bytes = new Uint8Array(length);
  for (var n = 0; n < length; ++n)
    bytes[n] = str.charCodeAt(n) & 0xFF;
  return bytes;
}

var IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

var Util = PDFJS.Util = (function UtilClosure() {
  function Util() {}

  Util.makeCssRgb = function Util_makeCssRgb(rgb) {
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  };

  Util.makeCssCmyk = function Util_makeCssCmyk(cmyk) {
    var cs = new DeviceCmykCS();
    Util.makeCssCmyk = function makeCssCmyk(cmyk) {
      var rgb = cs.getRgb(cmyk, 0);
      return Util.makeCssRgb(rgb);
    };
    return Util.makeCssCmyk(cmyk);
  };

  // Concatenates two transformation matrices together and returns the result.
  Util.transform = function Util_transform(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  };

  // For 2d affine transforms
  Util.applyTransform = function Util_applyTransform(p, m) {
    var xt = p[0] * m[0] + p[1] * m[2] + m[4];
    var yt = p[0] * m[1] + p[1] * m[3] + m[5];
    return [xt, yt];
  };

  Util.applyInverseTransform = function Util_applyInverseTransform(p, m) {
    var d = m[0] * m[3] - m[1] * m[2];
    var xt = (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
    var yt = (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
    return [xt, yt];
  };

  // Applies the transform to the rectangle and finds the minimum axially
  // aligned bounding box.
  Util.getAxialAlignedBoundingBox =
    function Util_getAxialAlignedBoundingBox(r, m) {

    var p1 = Util.applyTransform(r, m);
    var p2 = Util.applyTransform(r.slice(2, 4), m);
    var p3 = Util.applyTransform([r[0], r[3]], m);
    var p4 = Util.applyTransform([r[2], r[1]], m);
    return [
      Math.min(p1[0], p2[0], p3[0], p4[0]),
      Math.min(p1[1], p2[1], p3[1], p4[1]),
      Math.max(p1[0], p2[0], p3[0], p4[0]),
      Math.max(p1[1], p2[1], p3[1], p4[1])
    ];
  };

  Util.inverseTransform = function Util_inverseTransform(m) {
    var d = m[0] * m[3] - m[1] * m[2];
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d,
      (m[2] * m[5] - m[4] * m[3]) / d, (m[4] * m[1] - m[5] * m[0]) / d];
  };

  // Apply a generic 3d matrix M on a 3-vector v:
  //   | a b c |   | X |
  //   | d e f | x | Y |
  //   | g h i |   | Z |
  // M is assumed to be serialized as [a,b,c,d,e,f,g,h,i],
  // with v as [X,Y,Z]
  Util.apply3dTransform = function Util_apply3dTransform(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
  };

  // This calculation uses Singular Value Decomposition.
  // The SVD can be represented with formula A = USV. We are interested in the
  // matrix S here because it represents the scale values.
  Util.singularValueDecompose2dScale =
    function Util_singularValueDecompose2dScale(m) {

    var transpose = [m[0], m[2], m[1], m[3]];

    // Multiply matrix m with its transpose.
    var a = m[0] * transpose[0] + m[1] * transpose[2];
    var b = m[0] * transpose[1] + m[1] * transpose[3];
    var c = m[2] * transpose[0] + m[3] * transpose[2];
    var d = m[2] * transpose[1] + m[3] * transpose[3];

    // Solve the second degree polynomial to get roots.
    var first = (a + d) / 2;
    var second = Math.sqrt((a + d) * (a + d) - 4 * (a * d - c * b)) / 2;
    var sx = first + second || 1;
    var sy = first - second || 1;

    // Scale values are the square roots of the eigenvalues.
    return [Math.sqrt(sx), Math.sqrt(sy)];
  };

  // Normalize rectangle rect=[x1, y1, x2, y2] so that (x1,y1) < (x2,y2)
  // For coordinate systems whose origin lies in the bottom-left, this
  // means normalization to (BL,TR) ordering. For systems with origin in the
  // top-left, this means (TL,BR) ordering.
  Util.normalizeRect = function Util_normalizeRect(rect) {
    var r = rect.slice(0); // clone rect
    if (rect[0] > rect[2]) {
      r[0] = rect[2];
      r[2] = rect[0];
    }
    if (rect[1] > rect[3]) {
      r[1] = rect[3];
      r[3] = rect[1];
    }
    return r;
  };

  // Returns a rectangle [x1, y1, x2, y2] corresponding to the
  // intersection of rect1 and rect2. If no intersection, returns 'false'
  // The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
  Util.intersect = function Util_intersect(rect1, rect2) {
    function compare(a, b) {
      return a - b;
    }

    // Order points along the axes
    var orderedX = [rect1[0], rect1[2], rect2[0], rect2[2]].sort(compare),
        orderedY = [rect1[1], rect1[3], rect2[1], rect2[3]].sort(compare),
        result = [];

    rect1 = Util.normalizeRect(rect1);
    rect2 = Util.normalizeRect(rect2);

    // X: first and second points belong to different rectangles?
    if ((orderedX[0] === rect1[0] && orderedX[1] === rect2[0]) ||
        (orderedX[0] === rect2[0] && orderedX[1] === rect1[0])) {
      // Intersection must be between second and third points
      result[0] = orderedX[1];
      result[2] = orderedX[2];
    } else {
      return false;
    }

    // Y: first and second points belong to different rectangles?
    if ((orderedY[0] === rect1[1] && orderedY[1] === rect2[1]) ||
        (orderedY[0] === rect2[1] && orderedY[1] === rect1[1])) {
      // Intersection must be between second and third points
      result[1] = orderedY[1];
      result[3] = orderedY[2];
    } else {
      return false;
    }

    return result;
  };

  Util.sign = function Util_sign(num) {
    return num < 0 ? -1 : 1;
  };

  // TODO(mack): Rename appendToArray
  Util.concatenateToArray = function concatenateToArray(arr1, arr2) {
    Array.prototype.push.apply(arr1, arr2);
  };

  Util.prependToArray = function concatenateToArray(arr1, arr2) {
    Array.prototype.unshift.apply(arr1, arr2);
  };

  Util.extendObj = function extendObj(obj1, obj2) {
    for (var key in obj2) {
      obj1[key] = obj2[key];
    }
  };

  return Util;
})();

var PageViewport = PDFJS.PageViewport = (function PageViewportClosure() {
  function PageViewport(viewBox, scale, rotation, offsetX, offsetY) {
    this.viewBox = viewBox;
    this.scale = scale;
    this.rotation = rotation;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // creating transform to convert pdf coordinate system to the normal
    // canvas like coordinates taking in account scale and rotation
    var centerX = (viewBox[2] + viewBox[0]) / 2;
    var centerY = (viewBox[3] + viewBox[1]) / 2;
    var rotateA, rotateB, rotateC, rotateD;
    switch (rotation % 360) {
      case -180:
      case 180:
        rotateA = -1; rotateB = 0; rotateC = 0; rotateD = 1;
        break;
      case -270:
      case 90:
        rotateA = 0; rotateB = 1; rotateC = 1; rotateD = 0;
        break;
      case -90:
      case 270:
        rotateA = 0; rotateB = -1; rotateC = -1; rotateD = 0;
        break;
      //case 360:
      //case 0:
      default:
        rotateA = 1; rotateB = 0; rotateC = 0; rotateD = -1;
        break;
    }
    var offsetCanvasX, offsetCanvasY;
    var width, height;
    if (rotateA === 0) {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = Math.abs(viewBox[3] - viewBox[1]) * scale;
      height = Math.abs(viewBox[2] - viewBox[0]) * scale;
    } else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = Math.abs(viewBox[2] - viewBox[0]) * scale;
      height = Math.abs(viewBox[3] - viewBox[1]) * scale;
    }
    // creating transform for the following operations:
    // translate(-centerX, -centerY), rotate and flip vertically,
    // scale, and translate(offsetCanvasX, offsetCanvasY)
    this.transform = [
      rotateA * scale,
      rotateB * scale,
      rotateC * scale,
      rotateD * scale,
      offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY,
      offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY
    ];

    this.width = width;
    this.height = height;
    this.fontScale = scale;
  }
  PageViewport.prototype = {
    clone: function PageViewPort_clone(args) {
      args = args || {};
      var scale = 'scale' in args ? args.scale : this.scale;
      var rotation = 'rotation' in args ? args.rotation : this.rotation;
      return new PageViewport(this.viewBox.slice(), scale, rotation,
                              this.offsetX, this.offsetY);
    },
    convertToViewportPoint: function PageViewport_convertToViewportPoint(x, y) {
      return Util.applyTransform([x, y], this.transform);
    },
    convertToViewportRectangle:
      function PageViewport_convertToViewportRectangle(rect) {
      var tl = Util.applyTransform([rect[0], rect[1]], this.transform);
      var br = Util.applyTransform([rect[2], rect[3]], this.transform);
      return [tl[0], tl[1], br[0], br[1]];
    },
    convertToPdfPoint: function PageViewport_convertToPdfPoint(x, y) {
      return Util.applyInverseTransform([x, y], this.transform);
    }
  };
  return PageViewport;
})();

var PDFStringTranslateTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0x2D8, 0x2C7, 0x2C6, 0x2D9, 0x2DD, 0x2DB, 0x2DA, 0x2DC, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014,
  0x2013, 0x192, 0x2044, 0x2039, 0x203A, 0x2212, 0x2030, 0x201E, 0x201C,
  0x201D, 0x2018, 0x2019, 0x201A, 0x2122, 0xFB01, 0xFB02, 0x141, 0x152, 0x160,
  0x178, 0x17D, 0x131, 0x142, 0x153, 0x161, 0x17E, 0, 0x20AC
];

function stringToPDFString(str) {
  var i, n = str.length, str2 = '';
  if (str[0] === '\xFE' && str[1] === '\xFF') {
    // UTF16BE BOM
    for (i = 2; i < n; i += 2)
      str2 += String.fromCharCode(
        (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1));
  } else {
    for (i = 0; i < n; ++i) {
      var code = PDFStringTranslateTable[str.charCodeAt(i)];
      str2 += code ? String.fromCharCode(code) : str.charAt(i);
    }
  }
  return str2;
}

function stringToUTF8String(str) {
  return decodeURIComponent(escape(str));
}

function isEmptyObj(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

function isBool(v) {
  return typeof v == 'boolean';
}

function isInt(v) {
  return typeof v == 'number' && ((v | 0) == v);
}

function isNum(v) {
  return typeof v == 'number';
}

function isString(v) {
  return typeof v == 'string';
}

function isNull(v) {
  return v === null;
}

function isName(v) {
  return v instanceof Name;
}

function isCmd(v, cmd) {
  return v instanceof Cmd && (!cmd || v.cmd == cmd);
}

function isDict(v, type) {
  if (!(v instanceof Dict)) {
    return false;
  }
  if (!type) {
    return true;
  }
  var dictType = v.get('Type');
  return isName(dictType) && dictType.name == type;
}

function isArray(v) {
  return v instanceof Array;
}

function isStream(v) {
  return typeof v == 'object' && v !== null && v !== undefined &&
         ('getChar' in v);
}

function isArrayBuffer(v) {
  return typeof v == 'object' && v !== null && v !== undefined &&
         ('byteLength' in v);
}

function isRef(v) {
  return v instanceof Ref;
}

function isPDFFunction(v) {
  var fnDict;
  if (typeof v != 'object')
    return false;
  else if (isDict(v))
    fnDict = v;
  else if (isStream(v))
    fnDict = v.dict;
  else
    return false;
  return fnDict.has('FunctionType');
}

/**
 * 'Promise' object.
 * Each object that is stored in PDFObjects is based on a Promise object that
 * contains the status of the object and the data. There might be situations
 * where a function wants to use the value of an object, but it isn't ready at
 * that time. To get a notification, once the object is ready to be used, s.o.
 * can add a callback using the `then` method on the promise that then calls
 * the callback once the object gets resolved.
 * A promise can get resolved only once and only once the data of the promise
 * can be set. If any of these happens twice or the data is required before
 * it was set, an exception is throw.
 */
var Promise = PDFJS.Promise = (function PromiseClosure() {
  var EMPTY_PROMISE = {};

  /**
   * If `data` is passed in this constructor, the promise is created resolved.
   * If there isn't data, it isn't resolved at the beginning.
   */
  function Promise(name, data) {
    this.name = name;
    this.isRejected = false;
    this.error = null;
    this.exception = null;
    // If you build a promise and pass in some data it's already resolved.
    if (data !== null && data !== undefined) {
      this.isResolved = true;
      this._data = data;
      this.hasData = true;
    } else {
      this.isResolved = false;
      this._data = EMPTY_PROMISE;
    }
    this.callbacks = [];
    this.errbacks = [];
    this.progressbacks = [];
  }
  /**
   * Builds a promise that is resolved when all the passed in promises are
   * resolved.
   * @param {Promise[]} promises Array of promises to wait for.
   * @return {Promise} New dependant promise.
   */
  Promise.all = function Promise_all(promises) {
    var deferred = new Promise();
    var unresolved = promises.length;
    var results = [];
    if (unresolved === 0) {
      deferred.resolve(results);
      return deferred;
    }
    for (var i = 0, ii = promises.length; i < ii; ++i) {
      var promise = promises[i];
      promise.then((function(i) {
        return function(value) {
          results[i] = value;
          unresolved--;
          if (unresolved === 0)
            deferred.resolve(results);
        };
      })(i));
    }
    return deferred;
  };
  Promise.prototype = {
    hasData: false,

    set data(value) {
      if (value === undefined) {
        return;
      }
      if (this._data !== EMPTY_PROMISE) {
        error('Promise ' + this.name +
              ': Cannot set the data of a promise twice');
      }
      this._data = value;
      this.hasData = true;

      if (this.onDataCallback) {
        this.onDataCallback(value);
      }
    },

    get data() {
      if (this._data === EMPTY_PROMISE) {
        error('Promise ' + this.name + ': Cannot get data that isn\'t set');
      }
      return this._data;
    },

    onData: function Promise_onData(callback) {
      if (this._data !== EMPTY_PROMISE) {
        callback(this._data);
      } else {
        this.onDataCallback = callback;
      }
    },

    resolve: function Promise_resolve(data) {
      if (this.isResolved) {
        error('A Promise can be resolved only once ' + this.name);
      }
      if (this.isRejected) {
        error('The Promise was already rejected ' + this.name);
      }

      this.isResolved = true;
      this.data = (typeof data !== 'undefined') ? data : null;
      var callbacks = this.callbacks;

      for (var i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i].call(null, data);
      }
    },

    progress: function Promise_progress(data) {
      var callbacks = this.progressbacks;
      for (var i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i].call(null, data);
      }
    },

    reject: function Promise_reject(reason, exception) {
      if (this.isRejected) {
        error('A Promise can be rejected only once ' + this.name);
      }
      if (this.isResolved) {
        error('The Promise was already resolved ' + this.name);
      }

      this.isRejected = true;
      this.error = reason || null;
      this.exception = exception || null;
      var errbacks = this.errbacks;

      for (var i = 0, ii = errbacks.length; i < ii; i++) {
        errbacks[i].call(null, reason, exception);
      }
    },

    then: function Promise_then(callback, errback, progressback) {
      if (!callback) {
        error('Requiring callback' + this.name);
      }

      // If the promise is already resolved, call the callback directly.
      if (this.isResolved) {
        var data = this.data;
        callback.call(null, data);
      } else if (this.isRejected && errback) {
        var error = this.error;
        var exception = this.exception;
        errback.call(null, error, exception);
      } else {
        this.callbacks.push(callback);
        if (errback)
          this.errbacks.push(errback);
      }

      if (progressback)
        this.progressbacks.push(progressback);
    }
  };

  return Promise;
})();

var StatTimer = (function StatTimerClosure() {
  function rpad(str, pad, length) {
    while (str.length < length)
      str += pad;
    return str;
  }
  function StatTimer() {
    this.started = {};
    this.times = [];
    this.enabled = true;
  }
  StatTimer.prototype = {
    time: function StatTimer_time(name) {
      if (!this.enabled)
        return;
      if (name in this.started)
        throw 'Timer is already running for ' + name;
      this.started[name] = Date.now();
    },
    timeEnd: function StatTimer_timeEnd(name) {
      if (!this.enabled)
        return;
      if (!(name in this.started))
        throw 'Timer has not been started for ' + name;
      this.times.push({
        'name': name,
        'start': this.started[name],
        'end': Date.now()
      });
      // Remove timer from started so it can be called again.
      delete this.started[name];
    },
    toString: function StatTimer_toString() {
      var times = this.times;
      var out = '';
      // Find the longest name for padding purposes.
      var longest = 0;
      for (var i = 0, ii = times.length; i < ii; ++i) {
        var name = times[i]['name'];
        if (name.length > longest)
          longest = name.length;
      }
      for (var i = 0, ii = times.length; i < ii; ++i) {
        var span = times[i];
        var duration = span.end - span.start;
        out += rpad(span['name'], ' ', longest) + ' ' + duration + 'ms\n';
      }
      return out;
    }
  };
  return StatTimer;
})();

PDFJS.createBlob = function createBlob(data, contentType) {
  if (typeof Blob === 'function')
    return new Blob([data], { type: contentType });
  // Blob builder is deprecated in FF14 and removed in FF18.
  var bb = new MozBlobBuilder();
  bb.append(data);
  return bb.getBlob(contentType);
};
