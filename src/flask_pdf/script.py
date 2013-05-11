# -*- coding: utf-8 -*-
"""Startup utilities"""
import os
import sys
from functools import partial

import paste.script.command
import werkzeug.script

etc = partial(os.path.join, 'parts', 'etc')

DEPLOY_INI = etc('deploy.ini')
DEPLOY_CFG = etc('deploy.cfg')

DEBUG_INI = etc('debug.ini')
DEBUG_CFG = etc('debug.cfg')

_buildout_path = __file__
for i in range(2 + __name__.count('.')):
    _buildout_path = os.path.dirname(_buildout_path)

abspath = partial(os.path.join, _buildout_path)
del _buildout_path


# bin/paster serve parts/etc/deploy.ini
def make_app(global_conf={}, config=DEPLOY_CFG, debug=False):
    from flask_pdf import app
    app.config.from_pyfile(abspath(config))
    app.debug = debug
    return app


# bin/paster serve parts/etc/debug.ini
def make_debug(global_conf={}, **conf):
    from werkzeug.debug import DebuggedApplication
    app = make_app(global_conf, config=DEBUG_CFG, debug=True)
    return DebuggedApplication(app, evalex=True)


# bin/flask-ctl shell
def make_shell():
    """Interactive Flask Shell"""
    from flask import request
    from flask_pdf.models import init_db as initdb
    app = make_app()
    http = app.test_client()
    reqctx = app.test_request_context
    return locals()


def _init_db(debug=False, dry_run=False):
    """Initialize the database."""
    from flask_pdf.models import init_db
    print 'init_db()'
    if dry_run:
        return
    # Configure the application
    if debug:
        make_debug()
    else:
        make_app()
    # Create the tables
    init_db()

def createsuperuser(debug=False, dry_run=False):
    from flask_pdf.models import User
    user = User(username='admin', email='admin@example.com')
    user.set_password('password')

    user.save()


def _serve(action, debug=False, dry_run=False):
    """Build paster command from 'action' and 'debug' flag."""
    if action == 'syncdb':
        # First, create the tables
        return _init_db(debug=debug, dry_run=dry_run)

    if action == 'createsuperuser':
        return createsuperuser(debug=debug, dry_run=dry_run)

    if debug:
        config = DEBUG_INI
    else:
        config = DEPLOY_INI

    argv = ['bin/paster', 'serve', config]

    if action in ('start', 'restart'):
        argv += [action, '--daemon']
    elif action in ('', 'fg', 'foreground'):
        argv += ['--reload']
    else:
        argv += [action]

    # Print the 'paster' command
    print ' '.join(argv)

    if dry_run:
        return

    # Configure logging and lock file
    if action in ('start', 'stop', 'restart', 'status'):
        argv += [
            '--log-file', abspath('var', 'log', 'paster.log'),
            '--pid-file', abspath('var', 'log', '.paster.pid'),
        ]
    sys.argv = argv[:2] + [abspath(config)] + argv[3:]
    # Run the 'paster' command
    paste.script.command.run()


# bin/flask-ctl ...
def run():
    action_shell = werkzeug.script.make_shell(make_shell, make_shell.__doc__)

    # bin/flask-ctl serve [fg|start|stop|restart|status|syncdb]
    def action_serve(action=('a', 'start'), dry_run=False):
        """Serve the application.

        This command serves a web application that uses a paste.deploy
        configuration file for the server and application.

        Options:
         - 'action' is one of [fg|start|stop|restart|status|syncdb]
         - '--dry-run' print the paster command and exit
        """
        _serve(action, debug=False, dry_run=dry_run)

    # bin/flask-ctl debug [fg|start|stop|restart|status|syncdb]
    def action_debug(action=('a', 'start'), dry_run=False):
        """Serve the debugging application."""
        _serve(action, debug=True, dry_run=dry_run)

    # bin/flask-ctl status
    def action_status(dry_run=False):
        """Status of the application."""
        _serve('status', dry_run=dry_run)

    # bin/flask-ctl stop
    def action_stop(dry_run=False):
        """Stop the application."""
        _serve('stop', dry_run=dry_run)

    werkzeug.script.run()
