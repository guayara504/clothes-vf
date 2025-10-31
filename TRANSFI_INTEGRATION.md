# TransFi Integration Guide

Este documento describe la integración de TransFi para pagos con criptomonedas (USDC) en la plataforma Clothes VF.

## 📋 Resumen de la Integración

TransFi permite a los usuarios pagar con criptomonedas (USDC en Ethereum) convirtiendo automáticamente pesos colombianos (COP) a USDC. El pago se procesa a través de TransFi y los fondos se reciben directamente en la wallet Ethereum del merchant.

## 🔧 Componentes Implementados

### 1. Backend (`Backend/app/services_orders.py`)

- **`create_transfi_session()`**: Crea una sesión de pago en TransFi
  - Genera una orden con los parámetros necesarios
  - Convierte COP a centavos (formato requerido por TransFi)
  - Usa autenticación Basic Auth
  - Devuelve el session ID para el frontend

- **`handle_transfi_webhook()`**: Procesa webhooks de TransFi
  - Recibe notificaciones cuando se completa un pago
  - Actualiza el estado de la orden en DynamoDB
  - Verifica la firma del webhook (opcional)
  - Guarda el hash de la transacción si está disponible

- **`verify_webhook_signature()`**: Verifica la firma del webhook (placeholder)

### 2. Backend Routes (`Backend/app/routes_orders.py`)

- **`POST /webhook/transfi`**: Endpoint que recibe webhooks de TransFi
  - Procesa eventos de pago completado
  - Actualiza las órdenes en la base de datos

### 3. Frontend (`Frontend/src/pages/CheckoutPage.jsx`)

- **Botón "💎 Pagar con Crypto"**: Nueva opción de pago en el checkout
  - Crea una sesión de TransFi al hacer clic
  - Redirige al checkout de TransFi
  - Maneja los estados de carga y errores

### 4. Terraform (`Backend/terraform/main.tf`)

Variables de entorno configuradas:
- `TRANSFI_USERNAME`: Username de la API
- `TRANSFI_PASSWORD`: Password de la API
- `TRANSFI_WEBHOOK_SECRET`: Secreto para verificar webhooks
- `MERCHANT_ETH_WALLET`: Dirección Ethereum del merchant
- `TRANSFI_API_BASE_URL`: URL base del API (sandbox/production)

## 🚀 Configuración Requerida

### 1. Obtener Credenciales de TransFi

1. Visita https://sandbox-api-dashboard.transfi.com/login
2. Registra tu cuenta (selecciona "API Driven Solution")
3. Verifica tu correo electrónico
4. Completa los detalles de tu empresa
5. Configura autenticación de dos factores (2FA)
6. Obtén tus credenciales de API desde el dashboard

### 2. Configurar Variables de Entorno

Edita `Backend/terraform/main.tf` y actualiza las siguientes variables:

```hcl
TRANSFI_USERNAME       = "tu_username_real"
TRANSFI_PASSWORD       = "tu_password_real"
TRANSFI_WEBHOOK_SECRET = "tu_webhook_secret_real"
MERCHANT_ETH_WALLET    = "0xTuDireccionEthereumReal"
TRANSFI_API_BASE_URL   = "https://sandbox-api.transfi.com"  # Para sandbox
```

### 3. Configurar Webhook

En el dashboard de TransFi (https://sandbox-api-dashboard.transfi.com):
1. Ve a la sección de Webhooks
2. Configura la URL de tu webhook: `https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/webhook/transfi`
3. Guarda el secreto del webhook: `InQrwXt2E5Z0Hs` (ya configurado en variables de entorno)
4. Configura los eventos: order.paid, order.canceled, order.failed

### 4. Aplicar Cambios de Terraform

```bash
cd Backend/terraform
terraform plan
terraform apply
```

## 📊 Flujo de Pago

1. **Cliente completa el formulario de checkout**
   - Ingresa datos de envío: nombre, email, dirección, teléfono

2. **Cliente selecciona "💎 Pagar con Crypto"**
   - El frontend llama a `POST /orders` con `paymentMethod: "TRANSFI_CRYPTO"`
   - El backend crea una orden en DynamoDB con estado "PENDIENTE_PAGO"
   - El backend llama a TransFi API para crear una sesión de pago
   - TransFi devuelve un session ID

3. **Redirección a TransFi**
   - El frontend redirige al cliente a: `https://checkout.transfi.com?sessionId={sessionId}`
   - El cliente completa el pago con criptomonedas en la plataforma de TransFi

4. **Webhook de TransFi**
   - Cuando el pago se completa, TransFi envía un webhook a `POST /webhook/transfi`
   - El backend actualiza la orden en DynamoDB:
     - `paymentStatus`: "PAID"
     - `orderStatus`: "COMPLETADO"
     - `transactionHash`: hash de la transacción blockchain

5. **Confirmación al cliente**
   - TransFi redirige al cliente de vuelta a la página de confirmación

## 🔐 Seguridad

### Verificación de Webhooks

Para mejorar la seguridad, implementa la verificación de firma de webhooks:

1. TransFi envía un header de firma con cada webhook
2. La función `verify_webhook_signature()` debe implementarse
3. Actualmente está deshabilitada para desarrollo

### Best Practices

- Usa HTTPS para todos los endpoints
- Almacena credenciales de forma segura (variables de entorno)
- No expongas secrets en el código
- Valida todos los datos de entrada en webhooks

## 📝 Notas Importantes

### Conversión de Moneda

- El backend convierte COP a centavos multiplicando por 100
- Ejemplo: $50,000 COP → 5,000,000 centavos

### Pares de Conversión

Actualmente configurado para:
- **Source**: COP (Pesos Colombianos)
- **Target Asset**: USDC (USD Coin)
- **Target Network**: Ethereum

### Respuestas de TransFi

El formato de respuesta esperado de TransFi puede variar. Verifica la documentación actual para los nombres exactos de los campos:
- `id` vs `sessionId`
- `status` vs `paymentStatus`
- `merchantOrderId` vs `orderId`

## 🔍 Debugging

### Logs del Backend

El backend imprime logs útiles:
```
Respuesta de TransFi al crear sesión: {...}
Error al crear sesión en TransFi: ...
Orden {orderId} actualizada con estado: {status}
```

### Verificar en DynamoDB

Consulta la tabla `Orders` para verificar:
- Estados de las órdenes
- Valores de paymentStatus
- Transaction hashes

### Testing en Sandbox

1. Usa el entorno de sandbox de TransFi
2. No necesitas tokens reales para probar
3. Las transacciones en sandbox no generan costos reales

## 📚 Referencias

- Dashboard Sandbox: https://sandbox-api-dashboard.transfi.com/login
- Documentación: https://docs.transfi.com
- Panel de Control: https://sandbox-api-dashboard.transfi.com

## ✅ Checklist de Implementación

- [x] Backend: Función `create_transfi_session()`
- [x] Backend: Función `handle_transfi_webhook()`
- [x] Backend: Endpoint `/webhook/transfi`
- [x] Frontend: Botón de pago TransFi
- [x] Frontend: Handler `handleTransfiSubmit()`
- [x] Terraform: Variables de entorno configuradas
- [ ] Credenciales reales de TransFi configuradas
- [ ] Webhook configurado en dashboard de TransFi
- [ ] Pruebas en sandbox completadas
- [ ] Verificación de firma de webhook implementada (opcional)

