# backend/app/services.py

import boto3
import uuid
import os
from decimal import Decimal
import json

# --- Configuración de DynamoDB ---
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE", "Products")
DYNAMODB_REGION = os.environ.get("DYNAMODB_REGION", "us-east-2")

# Usamos el cliente de alto nivel 'resource' que es más fácil de usar
dynamodb_client = boto3.resource("dynamodb", region_name=DYNAMODB_REGION)
table = dynamodb_client.Table(PRODUCTS_TABLE)

# Helper para convertir los números Decimal de DynamoDB a float/int para JSON
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

# --- Funciones de Productos (CRUD) ---

def get_all_products():
    """Obtiene todos los productos de la base de datos."""
    try:
        response = table.scan()
        return response.get("Items", [])
    except Exception as e:
        print(f"Error al obtener productos: {e}")
        return None

def get_product_by_id(product_id):
    """Obtiene un solo producto por su ID."""
    try:
        response = table.get_item(Key={"productId": product_id})
        return response.get("Item")
    except Exception as e:
        print(f"Error al obtener el producto {product_id}: {e}")
        return None

def create_product(product_data):
    """Crea un nuevo producto en la base de datos."""
    try:
        product_id = str(uuid.uuid4())
        item = {
            "productId": product_id,
            "name": product_data.get("name"),
            "description": product_data.get("description"),
            "price": int(product_data.get("price")),
            "category": product_data.get("category"),
            "imageUrl": product_data.get("imageUrl", ""),
            "status": "ACTIVO"
        }
        table.put_item(Item=item)
        return item
    except Exception as e:
        print(f"Error al crear producto: {e}")
        return None

def update_product(product_id, product_data):
    """Actualiza un producto existente de forma más robusta."""
    try:
        # Prevenimos que se intente actualizar la clave primaria (productId)
        if 'productId' in product_data:
            del product_data['productId']

        # Aseguramos que el precio sea un número entero
        if 'price' in product_data:
            try:
                product_data['price'] = int(product_data['price'])
            except (ValueError, TypeError):
                # Si el precio no es un número válido, lo eliminamos de la actualización
                del product_data['price']

        # Eliminamos campos con valores vacíos para evitar errores en DynamoDB
        update_data = {k: v for k, v in product_data.items() if v != ""}

        if not update_data:
            # No hay nada que actualizar
            return get_product_by_id(product_id)

        # Construir la expresión de actualización dinámicamente
        update_expression = "SET " + ", ".join(f"#{k}=:{k}" for k in update_data)
        expression_attribute_names = {f"#{k}": k for k in update_data}
        expression_attribute_values = {f":{k}": v for k, v in update_data.items()}

        response = table.update_item(
            Key={"productId": product_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"  # Devuelve el objeto completo actualizado
        )
        return response.get("Attributes")

    except Exception as e:
        print(f"Error al actualizar el producto {product_id}: {e}")
        return None

def delete_product(product_id):
    """Elimina un producto de la base de datos."""
    try:
        table.delete_item(Key={"productId": product_id})
        return True
    except Exception as e:
        print(f"Error al eliminar el producto {product_id}: {e}")
        return False