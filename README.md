# Marketplace – Tienda virtual

Sistema completo de tienda virtual:

- **API REST** en ASP.NET Core (.NET 10) con Entity Framework Core y autenticación JWT.
- **Frontend** en HTML/CSS/JS puro, servido por la propia API desde `wwwroot` (no requiere Node ni build).
- **Base de datos** SQL Server (o base en memoria para pruebas rápidas).

## Estructura

```
MarketplaceAPI/                  <- raíz (esta carpeta)
├── MarketplaceAPI.slnx          <- solución de Visual Studio (contiene un único proyecto)
├── docker-compose.yml           <- levanta API + frontend + SQL Server
├── Dockerfile
├── .env.example                 <- plantilla de variables (sin valores reales)
├── .gitignore / .dockerignore
└── MarketplaceAPI/              <- proyecto ASP.NET
    ├── Controllers/             <- Auth, Categorias, Productos, Compras, DetallesCompra, Roles, Usuarios
    ├── Data/                    <- modelos, DbContext y datos iniciales (seeder)
    ├── wwwroot/                 <- frontend (catálogo, carrito, login, páginas de gestión)
    └── Program.cs
```

---

## Opción 1: todo con un solo comando (Docker)

**Requisitos:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Compose v2). SQL Server necesita al menos 2 GB de RAM libres para Docker.

1. Crea tu archivo de configuración a partir de la plantilla:

   ```bash
   cp .env.example .env          # en Windows (PowerShell): copy .env.example .env
   ```

2. Abre `.env` y reemplaza los valores entre `< >`:
   - `DB_SA_PASSWORD`: contraseña de SQL Server (8+ caracteres, con mayúsculas, minúsculas, números y símbolos; sin `;` ni `=`).
   - `JWT_KEY`: clave secreta aleatoria de 32+ caracteres. Puedes generar una con `openssl rand -base64 48`.

3. Levanta el sistema:

   ```bash
   docker compose up --build
   ```

   La primera vez descarga imágenes y compila (varios minutos). La base de datos y las tablas se crean solas.

4. Abre **http://localhost:8080** (o el puerto de `API_PORT`).

   - Tienda: `http://localhost:8080`
   - Documentación de la API (Swagger): `http://localhost:8080/swagger`

Comandos útiles:

```bash
docker compose up -d --build    # ejecutar en segundo plano
docker compose logs -f api      # ver logs de la API
docker compose down             # detener (conserva los datos)
docker compose down -v          # detener y BORRAR la base de datos
```

> Si quieres probar sin SQL Server, pon `USE_INMEMORY_DB=true` en `.env`: los datos viven en memoria y se pierden al reiniciar.

---

## Opción 2: sin Docker (Visual Studio / .NET CLI)

**Requisitos:** [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
cd MarketplaceAPI
dotnet run --project MarketplaceAPI --launch-profile https
```

O abre `MarketplaceAPI.slnx` en Visual Studio 2022 (17.13 o superior, necesario para el formato `.slnx`) y presiona **F5**. Se abre en `https://localhost:7028`.

Por defecto `appsettings.json` usa `"UseInMemoryDb": true` (no necesita SQL Server). Para usar SQL Server local:

1. Pon `"UseInMemoryDb": false` y ajusta `ConnectionStrings:MarketplaceDb` en `appsettings.Development.json` (o con `dotnet user-secrets`).
2. Ejecuta de nuevo: las tablas se crean automáticamente si la base está vacía.

---

## Usuarios de prueba

Se crean automáticamente al primer arranque (clave de todos: `Demo1234`):

| Rol | Correo | Puede |
|---|---|---|
| Administrador | `admin@tienda.cl` | Todo: categorías, productos, usuarios, roles, compras |
| Vendedor | `vendedor@tienda.cl` | Gestionar sus productos |
| Comprador | `comprador@tienda.cl` | Comprar y ver sus compras |

Cualquier persona puede registrarse en `/register.html` (queda como Comprador).
**Antes de publicar en un servidor real, cambia o elimina estas cuentas de prueba** (ver `Data/DatabaseSeeder.cs`).

## Páginas del frontend

| Página | Acceso |
|---|---|
| `index.html` (catálogo y carrito, pago solo con tarjeta) | Público (comprar requiere sesión) |
| `login.html`, `register.html` | Público |
| `compras.html`, `detalles.html` | Cualquier usuario con sesión |
| `productos.html` | Administrador y Vendedor |
| `categorias.html`, `usuarios.html`, `roles.html` | Administrador |

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DB_SA_PASSWORD` | Contraseña de SQL Server (obligatoria) |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_KEY` | Clave secreta de los tokens (obligatoria, 32+ caracteres) |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_MINUTES` | Parámetros del JWT |
| `API_PORT` | Puerto publicado en tu equipo (por defecto 8080) |
| `USE_INMEMORY_DB` | `true` = base en memoria; `false` = SQL Server |
| `ASPNETCORE_ENVIRONMENT` | `Production` o `Development` |

## Problemas frecuentes

- **`Define DB_SA_PASSWORD en el archivo .env`**: falta crear `.env` (paso 1) o completar sus valores.
- **La API no conecta a SQL Server**: espera a que `db` aparezca como *healthy* (`docker compose ps`); revisa que la contraseña cumpla la complejidad exigida y no tenga `;` ni `=`.
- **Cambié la contraseña de SQL y ya no entra**: la contraseña queda guardada en el volumen; ejecuta `docker compose down -v` para empezar de cero (borra los datos).
- **Equipos con chip ARM (Apple Silicon)**: la imagen de SQL Server corre emulada y puede ser lenta; usa `USE_INMEMORY_DB=true` para pruebas.
- **El puerto 8080 está ocupado**: cambia `API_PORT` en `.env`.
