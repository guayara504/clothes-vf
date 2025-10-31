# 🔔 Configuración de Webhook TransFi

## 📍 URL del Webhook

```
https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/webhook/transfi
```

## 🔑 Credenciales

- **Secret**: InQrwXt2E5Z0Hs
- **Username**: clothesvf

## 📝 Pasos para Configurar

1. **Inicia sesión en TransFi Dashboard**
   - Ve a: https://sandbox-api-dashboard.transfi.com/login
   - Username: clothesvf
   - Password: qqyO2m5GwDuEsX

2. **Navega a la sección de Webhooks**
   - Busca "Webhooks" o "Settings" en el menú
   - Click en "Add New Webhook" o "Configure Webhook"

3. **Configura el Webhook**
   ```
   URL: https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/webhook/transfi
   Secret: InQrwXt2E5Z0Hs
   ```

4. **Selecciona los Eventos**
   - ✅ order.paid - Cuando el pago se completa
   - ✅ order.canceled - Cuando el pago se cancela
   - ✅ order.failed - Cuando el pago falla

5. **Guarda la Configuración**
   - Click en "Save" o "Create Webhook"

## ✅ Verificación

Para verificar que el webhook está funcionando:

1. Realiza una orden de prueba desde el frontend
2. Verifica los logs de AWS Lambda para ver si se recibió el webhook
3. Verifica en DynamoDB que la orden se actualizó correctamente

### En AWS CloudWatch:
```bash
# Busca logs con:
# "TransFi webhook received"
# "Order {orderId} updated with status:"
```

### En DynamoDB:
- Query la tabla "Orders"
- Verifica que `paymentStatus` = "PAID"
- Verifica que `orderStatus` = "COMPLETADO"
- Verifica que `transactionHash` existe

## 🔍 Troubleshooting

### El webhook no se está recibiendo
- Verifica que la URL es correcta (sin espacios)
- Verifica que el endpoint está desplegado
- Verifica que no hay firewall bloqueando

### El webhook se recibe pero falla
- Verifica los logs en CloudWatch
- Verifica que las credenciales son correctas
- Verifica que la firma del webhook es válida

### La orden no se actualiza
- Verifica que DynamoDB tiene permisos correctos
- Verifica que el orderId es correcto
- Verifica los logs del backend

## 🧪 Testing

Para probar el webhook manualmente:

```bash
curl -X POST https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/webhook/transfi \
  -H "Content-Type: application/json" \
  -d '{
    "merchantOrderId": "test-order-123",
    "status": "completed",
    "transactionHash": "0x1234567890abcdef..."
  }'
```

## 📊 Formato del Webhook

TransFi enviará datos en el siguiente formato:

```json
{
  "merchantOrderId": "uuid-de-la-orden",
  "status": "completed",
  "transactionHash": "0x...",
  "timestamp": "2024-01-01T00:00:00Z",
  "amount": {
    "source": 5000000,
    "target": 5000
  }
}
```

El backend procesará estos datos y actualizará la orden en DynamoDB.

