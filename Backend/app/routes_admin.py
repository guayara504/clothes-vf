# backend/app/routes_admin.py

from flask import Blueprint, jsonify, request
# Usa la ruta completa
from app import services

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/products", methods=["POST"])
def add_product():
    product_data = request.get_json()
    if not all(k in product_data for k in ["name", "price", "category"]):
        return jsonify({"error": "Faltan campos requeridos: name, price, category"}), 400

    new_product = services.create_product(product_data)
    if new_product is None:
        return jsonify({"error": "No se pudo crear el producto"}), 500
        
    return jsonify(new_product), 201

@admin_bp.route("/admin/products/<product_id>", methods=["PUT"])
def update_one_product(product_id):
    product_data = request.get_json()
    updated_product = services.update_product(product_id, product_data)
    if updated_product is None:
        return jsonify({"error": "No se pudo actualizar el producto"}), 500
    
    return jsonify(updated_product), 200

@admin_bp.route("/admin/products/<product_id>", methods=["DELETE"])
def delete_one_product(product_id):
    success = services.delete_product(product_id)
    if not success:
        return jsonify({"error": "No se pudo eliminar el producto"}), 500
    
    return jsonify({"message": "Producto eliminado exitosamente"}), 200