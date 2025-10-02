# backend/app/app.py

from flask import Flask
import awsgi
from flask_cors import CORS # <-- 1. IMPORTAR CORS
# Usa la ruta completa desde la raíz del paquete 'app'
from app.routes_public import public_bp
from app.routes_admin import admin_bp
from app.routes_orders import orders_bp


app = Flask(__name__)

# <-- 2. APLICAR CORS A LA APLICACIÓN
# Esto le dirá a nuestra API que acepte peticiones desde cualquier origen.
# Para producción, podríamos restringirlo solo a nuestro dominio.
CORS(app)

# Registramos nuestros Blueprints
app.register_blueprint(public_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(orders_bp)


def main_handler(event, context):
    return awsgi.response(app, event, context)