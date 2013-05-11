from flask_peewee.admin import Admin, ModelAdmin

from . import app, db
from .auth import auth
from .models import User, PDF

admin = Admin(app, auth)
auth.register_admin(admin)

admin.register(User, ModelAdmin)
admin.register(PDF, ModelAdmin)
