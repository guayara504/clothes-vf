# backend/app/routes_orders.py

from flask import Blueprint, jsonify, request
from . import services_orders # Importamos el nuevo servicio

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders", methods=["POST"])
def place_order():
    order_data = request.get_json()
    
    # Validación básica
    if not all(k in order_data for k in ["customerDetails", "items", "totalAmount", "paymentMethod"]):
        return jsonify({"error": "Faltan campos requeridos en la orden"}), 400

    result = services_orders.create_order(order_data)

    if result.get("status") == "error":
        return jsonify({"error": result.get("message")}), 500

    return jsonify(result), 201


@orders_bp.route("/webhook/mercadopago", methods=["POST"])
def mercadopago_webhook():
    notification = request.get_json()
    response, status_code = services_orders.handle_mercadopago_webhook(notification)
    return jsonify(response), status_code