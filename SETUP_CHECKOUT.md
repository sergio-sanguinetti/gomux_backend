# Configuración Checkout: Skydropx (envío) y Stripe (pago)

## Variables de entorno

### Skydropx (cotización de envíos)

Añade a tu `.env`:

```env
SKYDROPX_API_KEY=tu_api_key
SKYDROPX_API_SECRET=tu_api_secret
SKYDROPX_BASE_URL=https://pro.skydropx.com
```

Opcional (dirección de origen de tu tienda):

```env
SKYDROPX_ORIGIN_POSTAL_CODE=39000
SKYDROPX_ORIGIN_STATE=Guerrero
SKYDROPX_ORIGIN_MUNICIPALITY=Chilpancingo
SKYDROPX_ORIGIN_NEIGHBORHOOD=Centro
SKYDROPX_ORIGIN_STREET=Av. Juan N. Alvarez Sur #9
SKYDROPX_ORIGIN_NAME=Tienda
SKYDROPX_ORIGIN_COMPANY=Gomux
SKYDROPX_ORIGIN_PHONE=
SKYDROPX_ORIGIN_EMAIL=
SKYDROPX_CARRIERS=fedex,dhl
```

### Stripe (pagos con tarjeta)

En el **backend** (gomux_backend):

```env
STRIPE_SECRET_KEY=sk_test_...
```

En el **frontend** (gomu.mx), en `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Endpoints

- **POST /api/envio/cotizar**  
  Body: `{ items: [{ id, cantidad }], address_to: { zipCode, state, municipality, streetAddress, contactName, contactPhone, contactEmail } }`  
  Devuelve: `{ success, rates, paqueteCalculado }`.

- **POST /api/pagos/create-payment-intent**  
  Body: `{ amount: number (pesos), currency?: "mxn" }`  
  Devuelve: `{ success, clientSecret, paymentIntentId }`.

## Dependencias

En el backend ya están en `package.json`: `axios`, `stripe`. Ejecuta:

```bash
npm install
```

En el frontend: `@stripe/stripe-js`, `@stripe/react-stripe-js`. Ejecuta:

```bash
npm install
```

## Flujo en checkout

1. El usuario completa dirección y hace clic en **Cotizar envío (Skydropx)**.
2. Se llama a `/api/envio/cotizar`; se muestran las tarifas y el usuario elige una.
3. El total se actualiza: subtotal + envío.
4. Si paga con tarjeta: al enviar el formulario se crea un Payment Intent, se confirma el pago con Stripe y luego se crea la venta en `/api/ventas/public`.
5. Si paga contra entrega: se crea la venta directamente.
