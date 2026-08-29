# Guía de despliegue — MIC

Esta guía describe cómo ejecutar el **MIC** (Mapa Interactivo de Cabimas) en **desarrollo** y en **producción**. La aplicación vive en la carpeta `frontend/` (Next.js 14).

## Tabla de contenidos

- [Resumen](#resumen)
- [Requisitos](#requisitos)
- [Desarrollo (local)](#desarrollo-local)
- [Producción (build y ejecución)](#producción-build-y-ejecución)
- [Mapa offline y tiles](#mapa-offline-y-tiles)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Despliegue en un servidor (VPS)](#despliegue-en-un-servidor-vps)
- [Scripts de mantenimiento](#scripts-de-mantenimiento)
- [Checklist antes de publicar](#checklist-antes-de-publicar)
- [Problemas frecuentes](#problemas-frecuentes)

## Resumen

| Entorno | Comando principal | URL típica |
|---------|-------------------|------------|
| Desarrollo | `npm run dev` | http://localhost:3000 |
| Producción | `npm run build` → `npm run start` | http://localhost:3000 (o el puerto que configures) |

No hay backend separado: todo es una app **Next.js** que sirve la UI, los JSON en `data/` y los archivos estáticos en `public/`.

## Requisitos

- **Node.js** **22.15.0** o superior (misma versión recomendada en local y en el servidor)
- **npm** (incluido con Node)
- **Git** (para clonar el repositorio)

En `frontend/.npmrc` está activado `save-exact=true`: las nuevas dependencias se guardan con versión exacta en `package.json`. Respeta ese archivo al instalar paquetes.

## Desarrollo (local)

### 1. Clonar e instalar

```bash
git clone https://github.com/ejeoxlac/MIC.git
cd MIC/frontend
npm install
```

### 2. Tiles offline (recomendado)

El estilo de mapa por defecto es **Local (offline)**. Los tiles deben estar en:

```
frontend/public/tile/{z}/{x}/{y}.png
```

En el navegador se sirven como `/tile/{z}/{x}/{y}.png`. Si esa carpeta no existe o está incompleta, el mapa en modo local se verá en blanco o con recuadros vacíos. Puedes usar otros estilos del sidebar (Calles, Satélite, etc.) si hay conexión a internet.

### 3. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Comportamiento en desarrollo

- **Hot reload**: los cambios en componentes y estilos se recargan sin reiniciar manualmente.
- **Errores detallados**: Next muestra el overlay de errores en el navegador.
- **Leaflet**: el mapa se carga con `dynamic(..., { ssr: false })` para evitar errores de `window` en el servidor.
- **Puerto alternativo**: `npm run dev -- -p 3001` o `npx next dev -p 3001`.

### Comandos útiles en desarrollo

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | Revisión ESLint |
| `npm run build` | Probar el build de producción en local |
| `npm run gerar-rotas` | Regenerar JSON de rutas (requiere internet; ver [Scripts](#scripts-de-mantenimiento)) |

Dependencias de **desarrollo** (`typescript`, `eslint`, `@types/*`) solo hacen falta en tu máquina o en la fase de build; no son necesarias si en el servidor solo ejecutas el artefacto ya compilado (según cómo despliegues).

## Producción (build y ejecución)

La producción en Next.js es un proceso en **dos pasos**: generar el build y servir la app optimizada.

### 1. Build

Desde `frontend/`:

```bash
npm install
npm run build
```

Esto genera la carpeta `.next/` con el servidor y los bundles optimizados. Si el build falla, corrige errores antes de desplegar (a menudo TypeScript, ESLint o imports de Leaflet).

### 2. Arrancar en producción

```bash
npm run start
```

Por defecto escucha en el puerto **3000**. Para otro puerto:

```bash
# Linux / macOS
PORT=8080 npm run start

# Windows (PowerShell)
$env:PORT=8080; npm run start
```

### Diferencias respecto a desarrollo

| Aspecto | Desarrollo (`dev`) | Producción (`build` + `start`) |
|---------|--------------------|--------------------------------|
| Rendimiento | Más lento, orientado al desarrollador | Optimizado y minificado |
| Errores en pantalla | Overlay detallado | Páginas de error genéricas |
| Recarga | Automática al guardar | Hay que volver a hacer `build` tras cambios |
| `NODE_ENV` | `development` | `production` |

En hosting gestionado (Vercel, etc.) el proveedor suele ejecutar `build` y `start` (o su equivalente) por ti.

## Mapa offline y tiles

- **Modo local**: archivos en `frontend/public/tile/`. Son estáticos; inclúyelos en el despliegue si quieres mapa offline en producción.
- **Otros estilos** (Calles, Satélite, Terreno, Oscuro): cargan tiles desde internet (OpenStreetMap, Esri, etc.). El servidor de la app no necesita esos archivos, pero el **navegador del usuario** sí necesita salida a esas URLs.

Si el repositorio no incluye los tiles por tamaño, documenta en tu equipo cómo obtenerlos o copiarlos a `public/tile/` antes del deploy.

## Variables de entorno

Hoy el proyecto **no exige** un archivo `.env` para arrancar. Next.js admite variables opcionales:

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto de `npm run start` (por defecto `3000`) |
| `HOSTNAME` | Interfaz de escucha (por defecto `0.0.0.0` en muchos entornos) |
| `NODE_ENV` | Lo fija Next en `development` o `production` según el comando |

Si en el futuro añades variables `NEXT_PUBLIC_*`, créalas en el panel del hosting o en `.env.local` **solo en local** (no subas secretos al repositorio).

## Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com).
2. Configura el **Root Directory** en `frontend`.
3. Deja los comandos por defecto de Next.js:
   - **Build Command**: `npm run build`
   - **Output**: gestionado por Next (no hace falta `output: 'export'` salvo que quieras sitio 100 % estático).
4. **Install Command**: `npm install` (respetará `frontend/.npmrc`).
5. Sube o incluye los tiles en `public/tile/` si necesitas el estilo offline en producción.
6. Despliega. Cada push a la rama conectada puede generar un preview.

Los estilos de mapa online funcionan desde el cliente; el modo offline depende de que los PNG estén en el deploy.

## Despliegue en un servidor (VPS)

Ejemplo mínimo en Linux con Node instalado:

```bash
cd /var/www/MIC
git pull origin main
cd frontend
npm ci          # instala según package-lock.json
npm run build
PORT=3000 npm run start
```

Para dejar el proceso en segundo plano y que reinicie tras un fallo, usa un gestor de procesos (systemd, **PM2**, etc.).

### Ejemplo con PM2

```bash
cd /path/to/MIC/frontend
npm run build
pm2 start npm --name "mic" -- start
pm2 save
```

Detrás de **Nginx** o **Caddy**, configura un proxy inverso hacia `http://127.0.0.1:3000` y HTTPS con Let's Encrypt.

### Firewall y red

- Abre el puerto **80/443** en el proxy, no necesariamente el 3000 al mundo si solo Nginx habla con Node.
- Si usas solo estilos online, el servidor no necesita descargar tiles externos; los usuarios los piden desde el navegador.

## Scripts de mantenimiento

### `npm run gerar-rotas`

Genera archivos en `frontend/data/rutas/` usando la API pública de **OSRM**. Requiere **internet** en la máquina donde lo ejecutes. No es parte del arranque diario de la app; úsalo cuando actualices datos de rutas.

```bash
cd frontend
npm run gerar-rotas
```

Detalle en `frontend/scripts/README.md`.

## Checklist antes de publicar

- [ ] `cd frontend && npm run lint` sin errores nuevos relevantes
- [ ] `npm run build` termina correctamente
- [ ] `npm run start` y prueba en el navegador (mapa, filtros, sidebar, móvil)
- [ ] Tiles en `public/tile/` desplegados si usas modo **Local (offline)**
- [ ] `package-lock.json` y `package.json` commiteados tras cambiar dependencias
- [ ] No commitear `.next/`, `node_modules/` ni `.env` con secretos

## Problemas frecuentes

### El mapa local se ve gris o vacío

- Comprueba que existan archivos en `frontend/public/tile/{z}/{x}/{y}.png`.
- En DevTools → Red, busca peticiones a `/tile/...` con 404.

### Error de `window is not defined` o Leaflet

- El mapa debe cargarse solo en cliente (`dynamic` con `ssr: false`). No quites ese patrón en `app/page.js`.

### `npm run build` falla en el servidor

- Usa Node **22.15.0+**.
- Ejecuta `npm ci` en lugar de `npm install` en CI/producción para reproducir el lockfile.
- Revisa que las `devDependencies` estén instaladas en la fase de build (TypeScript, ESLint); en Vercel se instalan por defecto.

### Vuelven los `^` en `package.json`

- Instala siempre desde `frontend/` para que aplique `save-exact=true` en `.npmrc`.
- Si instalaste fuera de esa carpeta, revisa y fija versiones a mano.

### Rutas o API de rutas

- Los datos del mapa viven en `frontend/data/*.json`.
- Si existe `app/api/rutas`, es parte de Next; en producción se sirve igual que en desarrollo tras el build.

---

Para contribuir código y estándares del repo, ver [CONTRIBUTING.md](./CONTRIBUTING.md). Para una vista rápida del proyecto, ver [README.md](../README.md).
