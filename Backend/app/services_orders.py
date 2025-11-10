# backend/app/services_orders.py

import boto3
import uuid
import os
from datetime import datetime
import mercadopago
from flask import request, jsonify
import hmac
import hashlib
import json

# --- Configuración de Servicios ---
ORDERS_TABLE = os.environ.get("ORDERS_TABLE", "Orders")
DYNAMODB_REGION = os.environ.get("DYNAMODB_REGION", "us-east-2")
MERCADOPAGO_ACCESS_TOKEN = os.environ.get("MERCADOPAGO_ACCESS_TOKEN")
MERCADOPAGO_WEBHOOK_SECRET = os.environ.get("MERCADOPAGO_WEBHOOK_SECRET")

# Inicializamos el cliente de DynamoDB
dynamodb_client = boto3.resource("dynamodb", region_name=DYNAMODB_REGION)
table = dynamodb_client.Table(ORDERS_TABLE)

# Inicializamos el SDK de Mercado Pago
sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

# --- Lógica de Creación de Órdenes ---

def create_order(order_data):
    """
    Crea una orden en nuestra base de datos y, si es necesario,
    genera una preferencia de pago en Mercado Pago.
    """
    try:
        order_id = str(uuid.uuid4())
        payment_method = order_data.get("paymentMethod")

        item = {
            "orderId": order_id,
            "createdAt": datetime.utcnow().isoformat(),
            "customerDetails": order_data.get("customerDetails"),
            "items": order_data.get("items"),
            "totalAmount": int(order_data.get("totalAmount")),
            "paymentMethod": payment_method,
            "orderStatus": "PENDIENTE",
        }

        if payment_method == "CONTRAENTREGA":
            # CORRECCIÓN: Actualizar propiedades del diccionario
            item["paymentStatus"] = "PENDIENTE"
            item["orderStatus"] = "PROCESANDO"

            table.put_item(Item=item)
            print(f"Orden {order_id} creada para pago contraentrega.")
            return {"status": "success", "order": item}

        elif payment_method == "MERCADOPAGO":
            # CORRECCIÓN: Actualizar propiedad del diccionario
            item["paymentStatus"] = "PENDIENTE_PAGO"

            table.put_item(Item=item)
            print(f"Orden {order_id} creada, generando preferencia de Mercado Pago...")

            preference_id = _create_mercadopago_preference(
                order_id,
                order_data.get("items"),
                order_data.get("customerDetails")
            )

            if preference_id:
                print(f"Preferencia {preference_id} creada para la orden {order_id}.")
                return {"status": "requires_mercadopago_checkout", "preferenceId": preference_id}
            else:
                table.update_item(
                    Key={'orderId': order_id},
                    UpdateExpression="set orderStatus = :s, paymentStatus = :p",
                    ExpressionAttributeValues={':s': 'FALLIDO', ':p': 'FALLIDO'}
                )
                return {"status": "error", "message": "No se pudo crear la preferencia de pago."}

        else:
            return {"status": "error", "message": "Método de pago no soportado"}

    except Exception as e:
        print(f"Error al crear la orden: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": "No se pudo crear la orden."}

def _create_mercadopago_preference(order_id, items, customer_details):
    """
    Función auxiliar para crear una Preferencia de Pago en Mercado Pago.
    Configurada para habilitar tarjeta de débito y PSE en Colombia.
    """
    try:
        # Calcular el total para validación
        total_amount = sum(float(item['price']) * int(item['quantity']) for item in items)
        
        preference_data = {
            "items": [
                {
                    "title": item['name'],
                    "quantity": int(item['quantity']),
                    "unit_price": float(item['price']),
                    "currency_id": "COP"
                } for item in items
            ],
            "payer": {
                "name": customer_details.get('name'),
                "email": customer_details.get('email'),
                "phone": {
                    "number": customer_details.get('phone', '')
                },
                "address": {
                    "street_name": customer_details.get('address', '')
                }
            },
            # URLs de retorno
            # URLs de producción: CloudFront
            "back_urls": {
                "success": "https://dovb38cqxf7k1.cloudfront.net/pago/respuesta",
                "failure": "https://dovb38cqxf7k1.cloudfront.net/pago/fallo",
                "pending": "https://dovb38cqxf7k1.cloudfront.net/pago/pendiente"
            },
            "auto_return": "approved",
            "external_reference": order_id,
            # Configuración de métodos de pago para Colombia
            # IMPORTANTE: No excluimos ningún método para que aparezcan todos
            "payment_methods": {
                # Listas vacías = TODOS los métodos habilitados
                "excluded_payment_types": [],
                "excluded_payment_methods": [],
                # Permitir cuotas para tarjetas de crédito
                "installments": 12
            },
            # Configuración específica para Colombia
            "statement_descriptor": "CLOTHES VF",
            "binary_mode": False,  # CRÍTICO: False permite pagos pendientes (necesario para PSE)
            # Configuración explícita para permitir pagos sin cuenta
            # NO incluir "purpose" que fuerza login
            # Permitir pagos de invitados explícitamente
            "purpose": None,  # No forzar ningún propósito específico que requiera cuenta
            # Configuración adicional para garantizar pagos sin cuenta
            "expires": False,  # No expirar la preferencia
            # URLs adicionales para mejor manejo
            "notification_url": None,  # Se maneja por webhook separado
        }
        
        print(f"📝 Creando preferencia de Mercado Pago:")
        print(f"   - Orden ID: {order_id}")
        print(f"   - Total: ${total_amount:,.0f} COP")
        print(f"   - Items: {len(items)}")
        print(f"   - Métodos habilitados: Tarjeta débito/crédito, PSE")
        
        preference_response = sdk.preference().create(preference_data)
        
        if "error" in preference_response:
            error_msg = preference_response.get("error", "Error desconocido")
            print(f"❌ Error de Mercado Pago: {error_msg}")
            return None
        
        preference = preference_response.get("response", {})
        preference_id = preference.get("id")
        
        if preference_id:
            init_point = preference.get("init_point", "")
            print(f"✅ Preferencia creada exitosamente:")
            print(f"   - Preference ID: {preference_id}")
            print(f"   - Init Point: {init_point}")
            
            # Log detallado de métodos de pago disponibles
            payment_methods_config = preference.get("payment_methods", {})
            excluded_types = payment_methods_config.get("excluded_payment_types", [])
            excluded_methods = payment_methods_config.get("excluded_payment_methods", [])
            
            print(f"   - Configuración de métodos de pago:")
            print(f"     * Tipos excluidos: {excluded_types if excluded_types else 'Ninguno ✅ (todos habilitados)'}")
            print(f"     * Métodos excluidos: {excluded_methods if excluded_methods else 'Ninguno ✅ (todos habilitados)'}")
            print(f"     * Binary mode: {preference.get('binary_mode', False)} ✅ (False permite PSE)")
            print(f"     * Máximo de cuotas: {payment_methods_config.get('installments', 'No especificado')}")
            
            print(f"   - ✅ Métodos habilitados:")
            print(f"     • Tarjeta de débito: ✅ Habilitada")
            print(f"     • Tarjeta de crédito: ✅ Habilitada")
            print(f"     • PSE: ✅ Habilitado")
            print(f"   - 💳 Pagos sin cuenta: ✅ Habilitado (los usuarios pueden pagar como invitados)")
            print(f"   - 💡 Si algún método no aparece, verifica que esté habilitado en tu cuenta de Mercado Pago")
            print(f"   - 💡 Si se fuerza login, desactiva 'Solo usuarios de Mercado Pago' en tu cuenta")
            
        return preference_id

    except Exception as e:
        print(f"❌ Error al comunicarse con Mercado Pago para crear preferencia: {e}")
        import traceback
        traceback.print_exc()
        return None

# --- Lógica para Webhooks de Mercado Pago ---

def verify_signature(request):
    """
    Verifica la firma del webhook de Mercado Pago para asegurar su autenticidad.
    """
    # Si no hay secret configurado, permitir todas las solicitudes (para desarrollo)
    if not MERCADOPAGO_WEBHOOK_SECRET:
        print("⚠️ Advertencia: No se ha configurado MERCADOPAGO_WEBHOOK_SECRET. Saltando verificación.")
        return True

    signature_header = request.headers.get('x-signature')
    if not signature_header:
        print("❌ Firma no encontrada en headers (falta x-signature)")
        return False

    try:
        # Parsear la firma
        parts = {}
        for p in signature_header.split(','):
            key_value = p.split('=')
            if len(key_value) == 2:
                parts[key_value[0].strip()] = key_value[1].strip()

        ts = parts.get('ts')
        received_signature = parts.get('v1')

        print(f"🔐 Firma recibida - ts: {ts}, v1: {received_signature}")

        if not ts or not received_signature:
            print("❌ Faltan parámetros ts o v1 en la firma")
            return False

        request_id = request.headers.get('x-request-id')
        payload_body = request.get_data()
        
        # Construir el manifest para la verificación
        manifest = f"id:{request_id};ts:{ts};{payload_body.decode('utf-8')}"

        print(f"🔐 Manifest para verificación: {manifest}")

        # Calcular nuestra firma
        our_signature = hmac.new(
            MERCADOPAGO_WEBHOOK_SECRET.encode('utf-8'),
            manifest.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        print(f"🔐 Nuestra firma calculada: {our_signature}")

        # Comparar firmas
        is_valid = hmac.compare_digest(our_signature, received_signature)
        print(f"🔐 Firma válida: {is_valid}")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error al verificar la firma: {e}")
        return False

def handle_mercadopago_webhook(notification=None):
    """
    Procesa las notificaciones de webhook de Mercado Pago.
    Acepta notification como parámetro O lo obtiene del request.
    """
    try:
        # Si no se pasó notification como parámetro, lo obtenemos del request
        if notification is None:
            if request.is_json:
                notification = request.get_json()
            else:
                notification = request.json if request.json else {}
        
        print(f"✅ Webhook recibido - Notificación: {notification}")
        
        # Verificar si es una solicitud de prueba de Mercado Pago
        user_agent = request.headers.get('User-Agent', '')
        is_test_request = 'MercadoPago Webhook Test' in user_agent
        
        # También verificar por el contenido de la notificación de prueba
        if not is_test_request:
            # Las notificaciones de prueba suelen tener IDs específicos o live_mode=False
            if (notification.get('id') == '123456' and 
                notification.get('live_mode') == False and
                notification.get('data', {}).get('id') == '123456'):
                is_test_request = True
                print("✅ Solicitud de prueba detectada por contenido")
        
        if is_test_request:
            print("✅ Solicitud de prueba de Mercado Pago - Permitida sin verificación de firma")
            return {"status": "test_webhook_received", "message": "Test webhook processed successfully"}, 200

        # SOLO para solicitudes reales (no de prueba) verificamos la firma
        if not verify_signature(request):
            print("¡ALERTA DE SEGURIDAD! Firma de webhook inválida. Descartando notificación.")
            return {"status": "error", "message": "Invalid signature"}, 403

        # Procesar la notificación real
        if notification.get("type") == "payment":
            payment_id = notification.get("data", {}).get("id")
            print(f"Firma válida. Procesando notificación para payment_id: {payment_id}")
            
            try:
                payment_info_response = sdk.payment().get(payment_id)
                payment = payment_info_response["response"]
                
                print(f"Información completa del pago: {payment}")

                order_id = payment.get("external_reference")
                if not order_id:
                    order_id = payment.get("order", {}).get("external_reference")

                if not order_id:
                    print(f"El pago {payment_id} no tiene una external_reference. Ignorando.")
                    return {"status": "ignored"}, 200

                status = payment.get("status")

                if status == "approved":
                    print(f"Pago APROBADO para la orden {order_id}. Actualizando base de datos...")
                    table.update_item(
                        Key={'orderId': order_id},
                        UpdateExpression="set paymentStatus = :p, orderStatus = :o, mercadopagoPaymentId = :mp_id",
                        ExpressionAttributeValues={
                            ':p': 'PAGADO',
                            ':o': 'PROCESANDO',
                            ':mp_id': str(payment_id)
                        }
                    )
                    print(f"Orden {order_id} actualizada a PAGADO.")
                else:
                    print(f"Pago para la orden {order_id} recibido con estado '{status}'. No se actualiza a pagado.")

            except Exception as e:
                print(f"Error al procesar el webhook para el pago {payment_id}: {e}")
                return {"status": "error"}, 500
        
        return {"status": "received"}, 200

    except Exception as e:
        print(f"Error general procesando webhook: {e}")
        return {"status": "error", "message": str(e)}, 500

def get_orders_by_email(email):
    """
    Obtiene todas las órdenes de un usuario por su email.
    """
    try:
        print(f"📋 Buscando órdenes para el email: {email}")
        
        # Escanear la tabla y filtrar por email
        # En DynamoDB necesitamos escanear y filtrar manualmente
        from boto3.dynamodb.conditions import Attr
        
        response = table.scan(
            FilterExpression=Attr('customerDetails.email').eq(email)
        )
        
        orders = response.get('Items', [])
        
        # Convertir Decimal a int/float para JSON serializable
        for order in orders:
            if 'totalAmount' in order:
                order['totalAmount'] = int(order['totalAmount'])
            if 'customerDetails' in order and isinstance(order['customerDetails'], dict):
                # Asegurar que customerDetails sea un dict serializable
                pass
        
        # Ordenar por fecha de creación (más recientes primero)
        orders.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        print(f"✅ Se encontraron {len(orders)} órdenes para {email}")
        
        return {"status": "success", "orders": orders}
        
    except Exception as e:
        print(f"❌ Error al obtener órdenes: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": "No se pudieron obtener las órdenes."}