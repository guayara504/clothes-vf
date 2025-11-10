# backend/app/routes_admin.py

from flask import Blueprint, jsonify, request
# Usa la ruta completa
from app import services
from app import services_orders

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

@admin_bp.route("/admin/orders", methods=["GET"])
def get_all_orders():
    """Obtiene todas las órdenes para el panel de administración"""
    result = services_orders.get_all_orders()
    
    if result.get("status") == "error":
        return jsonify({"error": result.get("message")}), 500
    
    return jsonify({"status": "success", "data": result.get("orders", [])}), 200