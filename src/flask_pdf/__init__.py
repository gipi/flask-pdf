# -*- coding: utf-8 -*-
from flask import Flask, request, render_template
from flask_peewee.db import Database


class Settings(object):
    DATABASE = {
        'name': 'example.db',
        'engine': 'peewee.SqliteDatabase',
        'check_same_thread': False,
    }
    DEBUG = True
    SECRET_KEY = 'shhhh'

# create the application
app = Flask(__name__)
app.config.from_object(Settings)

db = Database(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save', methods=['POST',])
def save():
    print request.form['pages']
    return 'miao'
