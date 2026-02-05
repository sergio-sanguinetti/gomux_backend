# Configuración del Chat en Tiempo Real

## Backend (gomux_backend)

1. **Instalar dependencias**
   ```bash
   npm install
   ```
   (Incluye `socket.io` añadido para el chat.)

2. **Migrar base de datos**
   ```bash
   npx prisma migrate dev --name add_chat_tables
   ```
   O si prefieres solo aplicar el schema sin crear migración:
   ```bash
   npx prisma db push
   ```
   Luego:
   ```bash
   npx prisma generate
   ```

3. **Variables de entorno**
   Asegúrate de que en `.env` tengas al menos:
   - `DATABASE_URL` para MySQL
   - Opcional: `FRONTEND_URL` y `GOMUX_URL` para CORS de Socket.io (por defecto se permiten localhost:3000 y localhost:3001)

4. **Iniciar servidor**
   ```bash
   npm run dev
   ```
   El servidor expone la API REST en el puerto configurado (ej. 5000) y Socket.io en la misma URL (ej. `http://localhost:5000`).

## Frontend tienda (gomu.mx)

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Variable de entorno**
   En `.env.local` (o `.env`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Uso**
   - En cualquier página de la tienda aparece un botón flotante de chat (esquina inferior derecha).
   - Al hacer clic se abre el panel: el usuario introduce nombre, email y opcionalmente número de orden.
   - Tras "Iniciar chat" puede enviar y recibir mensajes en tiempo real.
   - En la página de detalle del pedido (`/order-details?orden=XXX`) hay un botón "Chatear sobre este pedido" que abre el chat con el número de orden ya vinculado.

## Admin (administracion_gomux)

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Variable de entorno**
   `NEXT_PUBLIC_API_URL` debe apuntar al mismo backend (ej. `http://localhost:5000`).

3. **Uso**
   - En el menú lateral aparece **Chats**.
   - En `/chats` se listan todas las conversaciones.
   - Al seleccionar una conversación se cargan los mensajes y se puede responder en tiempo real; los nuevos mensajes del cliente aparecen al instante.

## Resumen de flujos

- **Cliente (gomu.mx)**: abre el widget → introduce datos (y opcionalmente nº de orden) → inicia chat → escribe mensajes. Socket.io conecta con el backend y une al usuario a la sala de esa conversación.
- **Admin (administracion_gomux)**: entra en Chats → elige una conversación → se une a la sala por Socket.io → escribe respuestas; el cliente las recibe al instante.
- **Pedido**: desde "Rastrear pedido" el usuario llega a `/order-details`. El botón "Chatear sobre este pedido" abre el chat con ese número de orden asociado para que el admin vea el contexto en la lista de chats (columna "Orden").
