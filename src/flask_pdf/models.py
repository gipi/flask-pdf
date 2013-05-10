from peewee import CharField, DateTimeField
from . import db

import datetime

class PagesField(CharField):
    "Field that will contains the pages to be printed"
    # FIXME: enlarge field size to allow unlimited pages
    def db_values(self, value):
        return ','.join(value)

    def python_value(self, value):
        return value.split(',')

class PDF(db.Model):
    # here will go the User id
    title = CharField()
    date = DateTimeField(default=datetime.datetime.now)
    filepath = CharField()
    pages = PagesField()

def init_db():
    PDF.create_table()
