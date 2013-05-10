from peewee import CharField, DateTimeField, Field
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

def init_db():
    PDF.create_table()
