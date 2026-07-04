# Invitaciones SaaS — Fase 0 / Fase 1

Scaffold inicial de la plataforma (ver `arquitectura-invitaciones-saas.md` para el
diseño completo). Este estado cubre: design system base, modelos de datos,
conexión a Firebase, creación de invitación y RSVP público funcionando contra
Firestore real, y lectura de invitados protegida por `editToken` vía route handler.

## Requisitos

- Node.js 20+
- Una cuenta de Firebase (console.firebase.google.com)
- Una cuenta de Vercel (opcional, para deploy)
- Un repositorio en GitHub

## 1. Instalación

```bash
npm install
```

## 2. Configurar Firebase

1. Crea un proyecto en https://console.firebase.google.com
2. Habilita **Firestore** (modo producción) y **Storage**.
3. En *Project Settings > General > Tus apps*, registra una app web y copia
   las credenciales a un archivo `.env.local` (usa `.env.example` como base).
4. En *Project Settings > Service accounts*, genera una clave privada nueva
   y copia `project_id`, `client_email` y `private_key` a las variables
   `FIREBASE_ADMIN_*` del mismo `.env.local`. `FIREBASE_ADMIN_PRIVATE_KEY`
   debe ir entre comillas conservando los `\n` literales.
5. Instala Firebase CLI y despliega las reglas incluidas en este repo:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecciona tu proyecto
firebase deploy --only firestore:rules,storage:rules
```

## 3. Desarrollo local

```bash
npm run dev
```

## 4. Deploy a Vercel

1. Conecta este repositorio en https://vercel.com/new
2. Copia las mismas variables de `.env.local` a *Project Settings >
   Environment Variables* en Vercel.
3. Cada push a `main` despliega automáticamente.

## Estado del scaffold

Completo: design system (`components/ui`), modelos de dominio (`types/`),
Firebase client + admin, registry de plantillas, generación de slug,
`invitationService.createAndPublishInvitation`, `guestService.submitRsvp`,
lectura de invitados protegida por `editToken` vía
`app/api/invitations/[id]/guests`.

Pendiente (ver roadmap en `arquitectura-invitaciones-saas.md`): wizard de
creación multi-paso con UI, motor de plantillas visual (Hero/Countdown/Mapa/
Galería), dashboard con stats y tabla de invitados, exportación a Excel,
generación de QR, botones de compartir.

## Nota de diseño: "Pendientes" en el dashboard

El documento de arquitectura original lista "Pendientes" como stat del
dashboard. El modelo de datos del MVP solo registra invitados que **ya
respondieron** el RSVP (no existe una lista pre-cargada de invitados
esperados), así que no hay forma de calcular cuántos faltan por responder.
`GuestStats` (`types/guest.ts`) por ahora expone `confirmed`, `declined`,
`totalGuests` (respuestas recibidas) y los totales de personas — "Pendientes"
requeriría una feature futura de carga de lista de invitados esperados.
