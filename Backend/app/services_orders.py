# backend/app/services_orders.py
import boto3
import uuid
import os
from datetime import datetime
import requests
import hashlib # Usaremos SHA-256 para la firma
import json
from app.services import DecimalEncoder

# --- Configuración de DynamoDB ---
ORDERS_TABLE = os.environ.get("ORDERS_TABLE", "Orders")
DYNAMODB_REGION = os.environ.get("DYNAMODB_REGION", "us-east-2")

dynamodb_client = boto3.resource("dynamodb", region_name=DYNAMODB_REGION)
table = dynamodb_client.Table(ORDERS_TABLE)

BOLD_IDENTITY_KEY = os.environ.get("BOLD_IDENTITY_KEY")
BOLD_SECRET_KEY = os.environ.get("BOLD_SECRET_KEY")

def create_order(order_data):
    try:
        order_id = str(uuid.uuid4())
        payment_method = order_data.get("paymentMethod")
        total_amount = int(order_data.get("totalAmount"))
        
        # El frontend necesitará esta URL para la redirección después del pago
        redirect_url = "https://www.tudominio.com/pago/respuesta" # Debes definir esta URL

        item = {
            "orderId": order_id,
            "createdAt": datetime.utcnow().isoformat(),
            "customerDetails": order_data.get("customerDetails"),
            "items": order_data.get("items"),
            "totalAmount": total_amount,
            "paymentMethod": payment_method,
            "orderStatus": "PROCESANDO",
        }

        if payment_method == "CONTRAENTREGA":
            item["paymentStatus"] = "PENDIENTE"
            table.put_item(Item=item)
            return {"status": "success", "order": item}

        elif payment_method == "BOLD":
            item["paymentStatus"] = "PENDIENTE_PAGO"
            table.put_item(Item=item)

            # --- LÓGICA DE FIRMA PARA EL BOTÓN DE PAGO (CORREGIDA) ---
            # 1. El monto debe estar en centavos (sin decimales)
            amount_in_cents = total_amount * 100
            currency = "COP"

            # 2. Crear la cadena para firmar según la documentación
            string_to_sign = f"{order_id}{amount_in_cents}{currency}{redirect_url}{BOLD_SECRET_KEY}"

            # 3. Crear la firma usando SHA-256
            signature = hashlib.sha256(string_to_sign.encode('utf-8')).hexdigest()
            # --- FIN DE LA LÓGICA DE FIRMA ---
            
            # 4. Preparar los datos que el frontend usará para construir el botón/formulario de pago
            payment_data = {
                "order": order_id,
                "amount_in_cents": amount_in_cents,
                "currency": currency,
                "customer_email": item["customerDetails"].get("email"),
                "payment_description": f"Compra en Clothes VF - Orden #{order_id}",
                "redirect_url": redirect_url,
                "integrity_signature": signature,
                "payment_method_id": "NEQUI,BANCOLOMBIA,DAVIPLATA,PSE,TARJETA_DE_CREDITO",
                "dev_mode": "true", # Usar 'true' para el sandbox
                "identity_key": BOLD_IDENTITY_KEY,
            }

            return {"status": "requires_payment_form", "payment_data": payment_data}
        
        else:
            return {"status": "error", "message": "Método de pago no soportado"}

    except Exception as e:
        print(f"Error al crear la orden: {e}")
        return {"status": "error", "message": "No se pudo crear la orden."}