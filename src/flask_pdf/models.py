from peewee import CharField, DateTimeField, Field, BooleanField
from flask_peewee.auth import BaseUser

from . import db

import datetime

class PagesField(Field):
    "Field that will contains the pages to be printed"
    db_field = 'string'
    # FIXME: enlarge field size to allow unlimited pages
    def db_value(self, value):
        return ','.join([str(x) for x in value])

    def python_value(self, value):
        return [int(x) for x in value.split(',')]

class PDF(db.Model):
    # here will go the User id
    title = CharField()
    date = DateTimeField(default=datetime.datetime.now)
    filepath = CharField()
    pages = PagesField()

    def __unicode__(self):
        return self.title

class User(db.Model, BaseUser):
    username = CharField()
    password = CharField()
    email = CharField()
    join_date = DateTimeField(default=datetime.datetime.now)
    active = BooleanField(default=True)
    admin = BooleanField(default=False)

    def __unicode__(self):
        return self.username

def init_db():
    PDF.create_table(fail_silently=True)
    User.create_table(fail_silently=True)
