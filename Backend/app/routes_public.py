# backend/app/routes_public.py

from flask import Blueprint, jsonify
# Usa la ruta completa
from app import services
import json

public_bp = Blueprint("public", __name__)

@public_bp.route("/products", methods=["GET"])
def list_products():
    products = services.get_all_products()
    if products is None:
        return jsonify({"error": "No se pudieron obtener los productos"}), 500
    
    # Usamos el DecimalEncoder para asegurar que los precios se serialicen correctamente
    return json.dumps(products, cls=services.DecimalEncoder), 200, {'Content-Type': 'application/json'}

@public_bp.route("/products/<product_id>", methods=["GET"])
def get_one_product(product_id):
    product = services.get_product_by_id(product_id)
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    return json.dumps(product, cls=services.DecimalEncoder), 200, {'Content-Type': 'application/json'}