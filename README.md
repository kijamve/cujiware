# CUJIWARE Platform

CUJIWARE es una plataforma SAAS que proporciona acceso integral a un ecosistema de componentes de software (módulos o plugins) para tiendas en línea (e-commerce).

## 🛠️ Tecnologías Principales

- Framework: Astro
- Base de Datos: MySQL con Prisma ORM
- Autenticación: JWT
- Pagos: Stripe Integration

## 🎨 Identidad Visual

- Color Azul Principal: #008AFF (Pantone 2925 C)
- Color Verde Secundario: #79DA66 (Pantone 7487 C)

## 🧞 Comandos

> **Nota**: Se recomienda usar Yarn como gestor de paquetes para este proyecto. Aunque npm también funcionará, Yarn ofrece mejor rendimiento y consistencia en las instalaciones.

| Comando                   | Acción                                                    |
|---------------------------|-----------------------------------------------------------|
| `yarn`                    | Instala las dependencias                                  |
| `yarn dev`                | Inicia el servidor de desarrollo en `localhost:4321`      |
| `yarn build`              | Construye el sitio de producción en `./dist/`             |
| `yarn preview`            | Vista previa local de la construcción antes de desplegar  |
| `yarn astro ...`          | Ejecuta comandos CLI como `astro add`, `astro check`      |
| `yarn astro -- --help`    | Obtiene ayuda sobre el CLI de Astro                       |

## 🗄️ Estructura de la Base de Datos

### Modelos Principales

#### 👤 User

- **Propósito**: Gestión de usuarios del sistema
- **Campos Clave**:
  - `email`: Identificador único del usuario
  - `password`: Contraseña hasheada
  - `name`: Nombre del usuario
  - `country`: País de residencia
  - `billing_*`: Campos opcionales para facturación
- **Relaciones**:
  - One-to-Many con `Membership`
- **Índices**:
  - Email (búsqueda rápida)

#### 💳 Membership

- **Propósito**: Gestión de suscripciones y planes de usuarios
- **Campos Clave**:
  - `status`: Estado de la membresía (ACTIVE, INACTIVE, CANCELLED)
  - `start_date` y `end_date`: Período de validez
  - `payment_method`: Método de pago (STRIPE, VENEZUELA)
  - `stripe_subscription_id`: ID de suscripción en Stripe
- **Relaciones**:
  - Belongs-to `User`
  - Belongs-to `Plan`
  - One-to-Many con `License`
  - One-to-Many con `Payment`
- **Índices**:
  - user_id, plan_id, stripe_subscription_id, status

#### 🔑 License

- **Propósito**: Control de licencias para plugins
- **Campos Clave**:
  - `status`: Estado de la licencia (ACTIVE, INACTIVE, REVOKED)
  - `last_reset`: Fecha del último reset
- **Relaciones**:
  - Belongs-to `Membership`
  - One-to-Many con `LicenseUsage`
  - One-to-Many con `LicensePlugin`
- **Índices**:
  - membership_id, status

#### 💰 Plan

- **Propósito**: Definición de planes de suscripción
- **Campos Clave**:
  - `price` y `currency`: Información de costos
  - `interval`: Período de facturación (MONTH, SEMESTER, YEAR)
  - `features`: Array de características (JSON)
  - `stripe_price_id`: ID de precio en Stripe
  - `is_highlighted`: Plan destacado
  - `is_visible`: Visibilidad del plan
- **Relaciones**:
  - One-to-Many con `Membership`
- **Índices**:
  - interval

#### 🔌 Plugin System

##### PluginVersion

- **Propósito**: Control de versiones de plugins
- **Campos Clave**:
  - `plugin_slug`: Identificador del plugin
  - `version`: Versión específica
  - `file_name` y `file_path_server`: Ubicación del archivo
- **Índices**:
  - plugin_slug
  - Unique constraint en (plugin_slug, version)

##### LicensePlugin

- **Propósito**: Asignación de plugins a licencias
- **Campos Clave**:
  - `plugin_slug`: Plugin asignado
  - `domain`: Dominio autorizado
  - `last_usage`: Último uso registrado
- **Índices**:
  - license_id, plugin_slug
  - Unique constraint en (license_id, plugin_slug, domain)

##### LicenseUsage

- **Propósito**: Monitoreo de uso de licencias por dominio
- **Campos Clave**:
  - `domain`: Dominio donde se usa la licencia
  - `first_used_at`: Primer uso
  - `last_used_at`: Último uso
- **Índices**:
  - license_id, domain
  - Unique constraint en (license_id, domain)

#### 💸 Payment

- **Propósito**: Registro de transacciones y pagos
- **Campos Clave**:
  - `amount` y `currency`: Monto y moneda
  - `status`: Estado del pago (PENDING, COMPLETED, FAILED)
  - `payment_method`: Método de pago (STRIPE, VENEZUELA)
  - `stripe_invoice_id`: ID de factura en Stripe
  - `bank_name`, `currency_rate`, `reference`: Datos adicionales
- **Relaciones**:
  - Belongs-to `Membership`
- **Índices**:
  - membership_id, status, payment_method, stripe_invoice_id, reference

## 🚀 API Endpoints

### Autenticación (`/api/auth`)

#### POST /api/auth/register

- Registro de nuevos usuarios
- Body (form-data):
  - email: string
  - password: string
  - confirm-password: string
  - name: string
  - country: string
- Returns:
  - 201: { message: 'Usuario registrado exitosamente', user: { id, email, name, country } }
  - 400: { error: 'Todos los campos son requeridos' | 'Las contraseñas no coinciden' | 'El email ya está registrado' }
  - 500: { error: 'Error interno del servidor' }

#### POST /api/auth/login

- Inicio de sesión
- Body (form-data):
  - email: string
  - password: string
- Returns:
  - 200: {
      token: string,
      user: {
        id: string,
        email: string,
        name: string,
        country: string,
        memberships: Array
      }
    }
  - 400: { error: 'Email y contraseña son requeridos' }
  - 401: { error: 'Credenciales inválidas' }
  - 500: { error: 'Error interno del servidor' }
- Notas:
  - El token se envía también como cookie HttpOnly
  - El token expira en 7 días

#### POST /api/auth/logout

- Cierre de sesión
- Returns:
  - 200: { message: 'Sesión cerrada exitosamente' }
- Notas:
  - Elimina la cookie del token

### Usuarios (`/api/user`)

#### POST /api/user/update

- Actualizar perfil de usuario
- Headers: Authorization: Bearer `token`
- Body: {
    billing_full_name?: string,
    billing_phone?: string,
    billing_tax_id?: string,
    new_password?: string,
    confirm_password?: string
  }
- Returns:
  - 200: { message: 'Perfil actualizado correctamente' }
  - 400: { message: 'Las contraseñas no coinciden' | 'La contraseña debe tener al menos 8 caracteres' }
  - 500: { message: 'Error al actualizar el perfil' }
- Notas:
  - Todos los campos son opcionales
  - Si se proporciona new_password, también debe proporcionarse confirm_password

#### POST /api/user/change-password

- Cambiar contraseña
- Headers: Authorization: Bearer `token`
- Body: {
    current_password: string,
    new_password: string,
    confirm_password: string
  }
- Returns:
  - 200: { message: 'Contraseña actualizada correctamente' }
  - 400: {
      message: 'La contraseña actual es incorrecta' |
              'Las contraseñas no coinciden' |
              'La contraseña debe tener al menos 6 caracteres'
    }
  - 500: { message: 'Error al cambiar la contraseña' }

#### POST /api/user/update-billing

- Actualizar datos de facturación
- Headers: Authorization: Bearer `token`
- Body: {
    billing_full_name: string,
    billing_phone: string,
    billing_tax_id: string,
    billing_address: string
  }
- Returns:
  - 200: { message: 'Datos de facturación actualizados correctamente' }
  - 500: { message: 'Error al actualizar los datos de facturación' }

### Suscripciones (`/api/subscription`)

#### GET /api/subscription/plans

- Listar planes disponibles
- Query params: ?interval=month|semester|year

#### POST /api/subscription/create

- Crear nueva suscripción
- Headers: Authorization: Bearer `token`
- Query params: ?plan=<plan_id>
- Body: { plan: <plan_id> }
- Returns:
  - 200: { url: <stripe_checkout_url> } | { payment_method: 'venezuela', ... }
  - 400: { error: 'Plan no especificado' }
  - 401: { error: 'No autorizado' }
  - 404: { error: 'Plan no encontrado' }
  - 500: { error: 'Error interno del servidor' }
- Notas:
  - Para usuarios de Venezuela: retorna información para pago móvil
  - Para otros países: redirige a Stripe Checkout
  - Descuento del 50% en el primer mes para planes mensuales

#### POST /api/subscription/venezuela-payment

- Registrar pago móvil de Venezuela
- Headers: Authorization: Bearer `token`
- Body: {
    plan_id: string,
    bank_origin: string,
    bank_dest: string,
    tax_id: string, // Formato: V1234567, V12345678 o P12345678
    reference: string // 6 dígitos
  }
- Returns:
  - 200: { success: true, membership_id: string, amount_in_bs: number }
  - 400: { error: 'Faltan datos requeridos' | 'Formato de cédula inválido' | 'Formato de referencia inválido' }
  - 401: { error: 'No autorizado' }
  - 404: { error: 'Plan no encontrado' }
  - 500: { error: 'Error interno del servidor' }

#### POST /api/subscription/cancel

- Cancelar suscripción activa
- Headers: Authorization: Bearer `token`
- Body: { membership_id: string }
- Returns:
  - 200: { message: 'Suscripción cancelada exitosamente' }
  - 400: { message: 'ID de membresía requerido' }
  - 404: { message: 'Membresía no encontrada o no está activa' }
  - 500: { message: 'Error al cancelar la suscripción' }
- Notas:
  - Si es suscripción de Stripe, también cancela en Stripe
  - Actualiza el estado de la membresía a 'cancelled'

### Licencias (`/api/licenses`)

#### GET /api/licenses

- Listar licencias del usuario
- Headers: Authorization: Bearer `token`

#### POST /api/licenses/validate

- Validar licencia para un dominio y plugin
- Body: { license_id, domain, plugin_slug }
- Returns:
  - 200: { valid: true, license: {...} }
  - 400: { error: 'Missing required fields' }
  - 403: { error: 'License is not active' | 'Membership has expired' | 'This license was used with another domain in the last 72 hours' }
  - 404: { error: 'License not found' }

#### POST /api/licenses/{id}/reset

- Resetear una licencia (elimina todos los usos)
- Headers: Authorization: Bearer `token`
- Returns:
  - 200: { message: 'Licencia reseteada exitosamente' }
  - 400: { message: 'Debes esperar 15 días entre cada reset de licencia' }
  - 404: { message: 'Licencia no encontrada' }
  - 500: { message: 'Error al resetear la licencia' }
- Notas:
  - Solo se puede resetear cada 15 días
  - Elimina todos los registros de uso de la licencia

### Plugins (`/api/plugins`)

#### GET /api/plugins/{slug}/versions

- Listar versiones disponibles de un plugin
- Returns:
  - 200: [{ id, version, file_name, created_at, download_token }]
  - 400: 'Slug no proporcionado'
  - 500: 'Error interno del servidor'
- Notas:
  - download_token solo se incluye si el usuario está autenticado
  - El token expira en 10 minutos

#### GET /api/plugins/{slug}/{token}/{version}

- Descargar una versión específica del plugin
- Headers: Authorization: Bearer `token`
- Returns:
  - 200: Archivo del plugin (application/octet-stream)
  - 400: 'Parámetros incompletos'
  - 401: 'No autorizado'
  - 403: 'Se requiere una licencia activa para descargar este plugin'
  - 404: 'Token inválido' | 'Versión no encontrada' | 'Archivo no encontrado'
  - 410: 'Token expirado'
  - 500: 'Error interno del servidor'
- Notas:
  - Requiere token de descarga válido
  - El token debe coincidir con el usuario autenticado
  - El usuario debe tener una licencia activa

### Webhooks (`/api/webhooks`)

#### POST /api/webhooks/stripe

- Webhook para eventos de Stripe
- Headers: Stripe-Signature
- Body: Evento de Stripe
