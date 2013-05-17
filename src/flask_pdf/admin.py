from flask_peewee.admin import Admin, ModelAdmin, AdminModelConverter

from . import app, db
from .auth import auth
from .models import User, PDF, PagesField
from wtforms import fields

class PagesFormField(fields.TextField):
    def process_data(self, value):
        "Here we have model data"
        self.data = ','.join([str(x) for x in value])

    def process_formdata(self, valuelist):
        self.data = valuelist[0].split(',')

class PDFPagesConverter(AdminModelConverter):
    def __init__(self, model_admin, **kwargs):
        super(PDFPagesConverter, self).__init__(model_admin, **kwargs)
        self.converters[PagesField] = self.handle_pages

    def handle_pages(self, model, field, **kwargs):
        return field.name, PagesFormField(**kwargs)

class PDFAdmin(ModelAdmin):
    filter_exclude = ['pages',]
    columns = (
        'title',
        'pages',
    )
    form_converter = PDFPagesConverter

admin = Admin(app, auth)
auth.register_admin(admin)

admin.register(User, ModelAdmin)
admin.register(PDF, PDFAdmin)
