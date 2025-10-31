# Configuración de TransFi - Clothes VF

## ✅ Credenciales Configuradas

### Información de Cuenta TransFi
- **Username**: clothesvf
- **Password**: qqyO2m5GwDuEsX
- **Webhook Secret**: InQrwXt2E5Z0Hs
- **Dashboard**: https://sandbox-api-dashboard.transfi.com/login

### Wallet Ethereum
- **Dirección**: 0x9086B21DACb6ee1499c80e2B76722eEe56Fba7bB
- **Network**: Ethereum
- **Asset**: USDC (USD Coin)
- **Note**: Esta es la wallet donde se recibirán los pagos en USDC

## 🔗 URLs de API

### Backend API
- **URL de Invocación**: https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/
- **Región**: us-east-2
- **API Gateway**: AWS Lambda

### TransFi API
- **URL Sandbox**: https://sandbox-api.transfi.com
- **URL Production**: https://api.transfi.com (cuando estés listo para producción)

## 🔔 Configuración de Webhook

En el dashboard de TransFi (https://sandbox-api-dashboard.transfi.com), configura el webhook:

### URL del Webhook
```
https://zxxwe9fta9.execute-api.us-east-2.amazonaws.com/v1/webhook/transfi
```

### Headers (si son requeridos)
- Secret: InQrwXt2E5Z0Hs

### Eventos a Configurar
- ✅ order.paid (when payment is confirmed)
- ✅ order.canceled (when payment is canceled)
- ✅ order.failed (when payment fails)

## 💰 Configuración de Pagos

### Conversión de Moneda
- **Moneda de Origen**: COP (Pesos Colombianos)
- **Moneda de Destino**: USDC en Ethereum
- **Conversión**: COP → USDC (automática por TransFi)

### Ejemplo de Conversión
- 50,000 COP → Aproximadamente $50 USD → Aproximadamente 50 USDC
- La conversión exacta depende del tipo de cambio en el momento

## 🧪 Testing en Sandbox

### Pasos para Probar
1. Deploy el backend actualizado:
   ```bash
   cd Backend/terraform
   terraform apply
   ```

2. Verifica que el webhook esté configurado en TransFi dashboard

3. Realiza una orden de prueba desde el frontend:
   - Agrega productos al carrito
   - Completa el formulario de checkout
   - Selecciona "💎 Pagar con Crypto"
   - Completa el pago en TransFi sandbox

4. Verifica en DynamoDB:
   - La orden debe aparecer con estado "COMPLETADO"
   - El paymentStatus debe ser "PAID"
   - El transactionHash debe estar presente

## 📊 Flujo de Pago TransFi

```
Cliente → Frontend → Backend → TransFi API
                                    ↓
                            TransFi Checkout
                                    ↓
                            Cliente Paga
                                    ↓
                            TransFi Webhook
                                    ↓
                              Backend
                                    ↓
                           Update DynamoDB
                                    ↓
                              Order Status
```

## 🔒 Seguridad

### Credenciales
- ✅ Username y Password están en variables de entorno
- ✅ Webhook Secret configurado
- ✅ Wallet address verificada

### Próximos Pasos de Seguridad
- [ ] Implementar verificación de firma de webhook
- [ ] Agregar rate limiting en el endpoint de webhook
- [ ] Implementar logging de transacciones
- [ ] Configurar alertas para pagos fallidos

## 📱 Frontend Integration

El botón "💎 Pagar con Crypto" en el checkout ya está configurado para:
1. Crear sesión en TransFi
2. Redirigir al cliente a checkout.transfi.com
3. Completar el pago con USDC

## 🚀 Deploy a Producción

Cuando estés listo para producción:

1. Actualiza en `Backend/terraform/main.tf`:
   ```hcl
   TRANSFI_API_BASE_URL = "https://api.transfi.com"
   ```

2. Obtén credenciales de producción desde TransFi

3. Configura el webhook de producción

4. Actualiza el MERCHANT_ETH_WALLET si es diferente

5. Prueba con un pago real pequeño antes de lanzar

## 📞 Soporte

- **Documentación TransFi**: https://docs.transfi.com
- **Dashboard Sandbox**: https://sandbox-api-dashboard.transfi.com
- **Dashboard Production**: https://api-dashboard.transfi.com

## ✅ Checklist de Configuración

- [x] Credenciales configuradas en terraform
- [x] Wallet Ethereum verificada (0x9086B21DACb6ee1499c80e2B76722eEe56Fba7bB)
- [x] Backend actualizado con handlers de TransFi
- [x] Frontend con botón de pago TransFi
- [x] Webhook endpoint configurado (/webhook/transfi)
- [ ] Webhook configurado en dashboard de TransFi ⚠️ HACER ESTO
- [ ] Deploy del backend actualizado
- [ ] Prueba completa de flujo de pago

