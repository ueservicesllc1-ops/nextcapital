## Next Capital

Plataforma de inversión moderna con dashboard tipo trading, construida con Next.js App Router + Firebase + Stripe.

### Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Auth + Firestore + Storage
- Stripe (intención de pago)
- Recharts (gráficas)

### Setup

1. Copia `.env.example` a `.env.local` y completa credenciales.
2. Instala dependencias con `npm install`.
3. Ejecuta desarrollo con `npm run dev`.
4. Configura Firebase CLI y proyecto activo:
   - `npx -y firebase-tools@latest login`
   - `npx -y firebase-tools@latest use --add <PROJECT_ID>`
5. Publica reglas:
   - `npx -y firebase-tools@latest deploy --only firestore:rules,storage`
6. Configura webhook Stripe en test mode:
   - Endpoint: `http://localhost:3000/api/stripe/webhook`
   - Evento requerido: `payment_intent.succeeded` y `payment_intent.payment_failed`
   - Guarda `STRIPE_WEBHOOK_SECRET` en `.env.local`

### Estructura principal

- Landing pública en `/`
- Auth en `/login` y `/register`
- Dashboard inversionista en `/dashboard`
- Panel admin en `/admin`
- APIs seguras en `src/app/api`
- Recuperación de contraseña en `/forgot-password`
- Verificación de email en `/verify-email`

### Seguridad implementada

- Usuario sin email verificado no puede entrar a `/dashboard`.
- `/admin` valida rol en frontend y backend (`requireAdmin` + Firestore role / custom claims).
- Lógica crítica de dinero solo en API routes.
- Aprobación/rechazo con control de doble procesamiento.

### Disclaimer

Toda inversión conlleva riesgo. Los rendimientos no están garantizados.
