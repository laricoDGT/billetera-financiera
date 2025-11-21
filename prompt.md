# Billetera Financiera — README

## Resumen

Proyecto: **Billetera financiera (gastos, deudas, ahorros, créditos)**
Sin conexión a bancos (MVP). PWA instalable. Backend en Neon Postgres.

**Stack mínimo**

- Frontend: Astro 5.16+, TailwindCSS 4.1+
- Backend: API (Node/Edge/Serverless) — preferiblemente TypeScript
- DB: Neon Postgres
- Auth: Google OAuth + Email/Password
- PWA: Service Worker + Web Push (VAPID)

---

## Objetivo del README

Guía paso a paso para desarrollar la webapp. Cada sección indica tareas concretas y entregables.

---

## 0. Preparación inicial

1. Crear repositorio (monorepo si quieres frontend/backend separados).
2. Configurar linters, Prettier, TypeScript, commit hooks (husky).
3. Crear proyecto base Astro + Tailwind.
4. Inicializar esquema de migrations (Prisma o TypeORM/Flyway).

**Entregables:** repo con plantilla Astro, linter y migrations iniciales.

---

## 1. Especificaciones y modelo de datos (1-2 días)

1. Revisar esquema propuesto y adaptarlo a necesidades.
2. Crear migrations iniciales en Neon Postgres.

**Modelo mínimo (tablas clave):**

- users
- accounts
- transactions
- categories
- reminders
- attachments
- debts
- audit_logs
- roles_permissions
- sessions

**Entregable:** migrations aplicadas en Neon (dev env).

---

## 2. Autenticación y administración básica (2-3 días)

1. Implementar registro/login con email+password (hash Argon2).
2. Integrar Google OAuth.
3. Implementar roles: user, superadmin.
4. Endpoints auth: `/auth/register`, `/auth/login`, `/auth/oauth/google`, `/me`.
5. Panel Superadmin básico: ver lista usuarios, cambiar roles, desactivar cuentas.

**Entregables:** auth funcionando + panel admin básico.

---

## 3. CRUD principal: cuentas, categorías, transacciones (4-6 días)

1. Endpoints REST (o GraphQL) CRUD para accounts, categories, transactions.
2. Validaciones y reglas (p. ej. transferencias entre cuentas).
3. Front: formularios para crear/editar transacciones, lista y filtros por fecha/categoría.
4. Implementar 10 categorías por defecto (global) y permitir categorías custom por usuario.

**Entregables:** CRUD completo + UI básico para transacciones.

---

## 4. Dashboard y reportes básicos (3 días)

1. Gráficos: ingresos vs gastos, gastos por categoría, tendencia mensual.
2. Net worth (suma cuentas menos deudas) calculado.
3. Endpoint `GET /reports/cashflow?from=&to=`.

**Entregable:** Dashboard por usuario con gráficos interactivos.

---

## 5. PWA y experiencia offline (Sincronización / Offline) (5-8 días)

### Objetivo: app usable offline, sincronización cuando vuelva conexión.

**Arquitectura offline-first (pasos):**

1. Service Worker y manifest — PWA instalable.
2. Local storage: usar IndexedDB para guardar cuentas, transacciones, categorías y cola de cambios.
3. Estrategia de sincronización:
   - Cada cambio local crea un `operation` en la cola con `client_id`, `timestamp`, `op_type`, `payload`.
   - Cuando hay conexión, worker o proceso en foreground empuja operaciones al endpoint `/sync` con auth.
   - Endpoint `/sync` aplica operaciones idempotentes usando `idempotency_key` (client_id + op_id).
   - Respuesta del servidor devuelve el estado canon actualizado y una lista de conflictos (si los hay).
4. Resolución de conflictos:
   - Default: Last-writer-wins por `updated_at` con opción de merge manual en UI.
   - Para transferencias/amounts, priorizar servidor si hay mismatch crítico y mostrar alerta al usuario.
5. Reconciliación inicial:
   - Al login, client descarga snapshot (`/sync/snapshot?since=ts`) y aplica cambios locales no sincronizados.
6. Background sync & retry:
   - Usar Background Sync API cuando esté disponible; fallback a sync en app open.
7. Tests: simular multi-device edit y conflictos.

**Entregables:** PWA instalable + IndexedDB local + endpoint `/sync` + lógica básica de reconciliación.

---

## 6. Reminders, notificaciones y recordatorios (2-4 días)

1. Modelo reminders con cron-like spec y `next_run`.
2. Worker/cron job que dispara recordatorios: envía Web Push + crea notification en app.
3. Integrar FCM + APNs para móviles (si se extiende más adelante).
4. UI para crear recordatorios recurrentes y gestionar notificaciones.

**Entregable:** recordatorios activos y push funcionando en entornos soportados.

---

## 7. Notas, attachments y export (2-3 días)

1. Notes: campo en transactions y tabla notes si necesario.
2. Attachments: subir a S3/minio; guardar metadatos en DB.
3. Export CSV/OFX desde el servidor (`GET /export?format=csv`).

**Entregable:** adjuntos simples y export funcional.

---

## 8. API para atajos y automatización (2 días)

1. Diseñar endpoints pensados para iOS Shortcuts / Android: crear transacción rápida, listar balance.
2. Documentación OpenAPI mínima y ejemplos de uso en Shortcuts.

**Entregable:** colección OpenAPI + ejemplos Shortcuts.

---

## 9. Seguridad, tests y observabilidad (3-5 días)

1. Seguridad:
   - TLS, CSP, CORS hardening.
   - Password hashing Argon2, rate limits en auth.
   - JWT + refresh tokens rotativos o httpOnly cookies.
   - RBAC enforcement en endpoints.
2. Tests: unit, integration y E2E (Playwright/Cypress).
3. Observability: error tracking (Sentry), metrics básicas.

**Entregable:** pruebas básicas y pipeline de QA.

---

## 10. Deploy y CI/CD (1-2 días)

1. CI: lint, tests, build.
2. CD: deploy a entorno staging, luego prod.
3. Neon Postgres: usar migrations automatizadas y backups encriptados.

**Entregable:** pipeline que despliega staging y prod.

---

## 11. Roadmap y siguientes pasos

**v1 (post-MVP):**

- Sincronización avanzada y resolución manual de conflictos en UI.
- Push más robusto; TOTP MFA.
- Multi-currency.

**v2:**

- OCR de recibos.
- Integraciones bancarias (open banking).
- ML para categorización automática.

---

## Checklist rápido (MVP)

- [ ] Repo + linters
- [ ] Migrations en Neon
- [ ] Auth (email + Google)
- [ ] CRUD transacciones/categorías/accounts
- [ ] Dashboard básico
- [ ] PWA + IndexedDB + sync endpoint
- [ ] Reminders + Web Push
- [ ] Superadmin básico
- [ ] Export CSV
- [ ] Tests críticos
- [ ] Deploy pipeline

---

## Notas técnicas crudas

- Usa pooling serverless-friendly para Neon (pgbouncer o pooler integrado).
- Indexa consultas por `(user_id, date)` y `(user_id, category_id)`.
- Mantén idempotencia en endpoints `/sync` y `POST /transactions` con `idempotency_key`.
- Almacena refresh tokens server-side si no usas httpOnly cookies.
- Particiona tablas grandes por mes si el volumen crece.

---
