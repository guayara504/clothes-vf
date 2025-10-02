# backend/app/app.py

from flask import Flask
import awsgi
# Usa la ruta completa desde la raíz del paquete 'app'
from app.routes_public import public_bp
from app.routes_admin import admin_bp
from app.routes_orders import orders_bp


app = Flask(__name__)

# Registramos nuestros Blueprints
app.register_blueprint(public_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(orders_bp)


def main_handler(event, context):
    return awsgi.response(app, event, context)