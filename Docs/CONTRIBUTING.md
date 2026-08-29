# Guía de Contribución — MIC

¡Gracias por tu interés en contribuir al **MIC** (Mapa Interactivo de Cabimas)! Este proyecto es de código abierto y cualquier contribución es bienvenida. Esta guía te ayudará a entender cómo contribuir de manera efectiva.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Issues](#reportar-issues)
- [Testing](#testing)
- [Ediciones con agentes (Cursor)](#ediciones-con-agentes-cursor)
- [Documentación](#documentación)

## Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente inclusivo y respetuoso. Al participar, aceptas:

- Ser respetuoso con todos los colaboradores
- Mantener un lenguaje profesional
- Aceptar críticas constructivas
- Enfocarte en lo que es mejor para el proyecto

## Cómo Contribuir

Hay varias formas de contribuir:

1. **Reportar bugs** o **sugerir mejoras** creando un issue
2. **Implementar nuevas funcionalidades** o **corregir bugs**
3. **Mejorar la documentación**
4. **Revisar pull requests** de otros colaboradores

### Primeros Pasos

1. Haz un fork del repositorio
2. Clona tu fork: `git clone https://github.com/tu-usuario/MIC.git`
3. Crea una rama para tu contribución: `git checkout -b feature/nueva-funcionalidad`
4. Sigue las instrucciones de configuración abajo

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- **Node.js** **22.15.0** o superior (recomendado usar la misma versión en local)
- **npm**
- **Git**

### Instalación Rápida

```bash
# Clona el repositorio
git clone https://github.com/ejeoxlac/MIC.git
cd MIC

# Instala dependencias y arranca el servidor de desarrollo
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Estructura del Proyecto

```
MIC/
├── Docs/              # Documentación del proyecto
├── frontend/          # Aplicación Next.js (mapa interactivo)
│   ├── app/           # Rutas y páginas (App Router)
│   ├── components/    # Componentes React (mapa, sidebar, etc.)
│   ├── data/          # JSON de ubicaciones y rutas
│   └── scripts/       # Utilidades (p. ej. generación de rutas)
└── README.md
```

### Scripts útiles

Desde la carpeta `frontend`:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (tras `build`) |
| `npm run lint` | ESLint |
| `npm run gerar-rotas` | Regenera datos de rutas (`scripts/gerar-rotas.js`) |

## Estándares de Código

### JavaScript / React

- Usa **ESLint** (configurado con `eslint-config-next`)
- Sigue las convenciones de **Next.js** y **React**
- Nombres de variables y funciones en inglés
- Comentarios en español para funcionalidades complejas
- Los datos estáticos del mapa viven en `frontend/data/` (JSON)

### Ediciones con agentes (Cursor)

Si usas Cursor u otro asistente de código:

1. Abre la **carpeta raíz del repositorio** (`MIC`), no solo `frontend/`, para que el contexto del proyecto sea correcto.
2. Limita los cambios a lo necesario para la tarea; no elimines código ajeno al cambio.
3. Revisa el diff antes de hacer commit:

```bash
git diff -- frontend/ruta/al/archivo
```

### Commits

Usamos mensajes descriptivos en español con el formato:

```
<tipo> / descripción breve

[cuerpo opcional]

[pie opcional]
```

#### Tipos de commit

- `Mejora /`: Nueva funcionalidad o mejora significativa
- `Arreglo /`: Corrección de bug
- `Docs /`: Cambios en documentación
- `Estilo /`: Cambios de estilo (espacios, formato, CSS, etc.)
- `Refactor /`: Refactorización de código sin cambiar funcionalidad
- `Test /`: Agregar o corregir tests
- `Actualización /`: Cambios en herramientas, configuración, dependencias
- `Rendimiento /`: Mejoras de rendimiento
- `Build /`: Cambios en el sistema de build
- `Seguridad /`: Actualizaciones relacionadas con seguridad
- `Temp /`: Subida temporal de archivos para guardar avances

#### Ejemplos

```
Mejora / agregar filtro de rutas en el sidebar

Arreglo / corregir marcadores que no aparecen al cambiar filtro

Docs / actualizar guía de instalación y CONTRIBUTING

Refactor / extraer lógica de capas del mapa a un hook

Test / agregar pruebas para el componente del mapa

Actualización / actualizar dependencias de Next.js

Mejora(mapa) / mostrar popup al hacer clic en marcadores de salud

Arreglo(ui) / corregir sidebar en pantallas móviles

Seguridad / actualizar librerías vulnerables
```

#### Buenas prácticas

- Usa verbos en imperativo (agregar, corregir, actualizar)
- Limita la línea del título a 50 caracteres cuando sea posible
- Describe qué se cambió y por qué
- Si el commit cierra un issue, incluye `Closes #123`
- Mantén commits atómicos (un cambio por commit)

### Ramas

- `main`: Rama principal (código estable)
- `feature/*`: Nuevas funcionalidades — p. ej. `feature/filtro-rutas`
- `bugfix/*`: Corrección de bugs — p. ej. `bugfix/marcadores-moviles`
- `docs/*`: Solo documentación

Flujo habitual:

```bash
git checkout main
git pull origin main
git checkout -b feature/descripcion-corta
# Desarrollar...
git add .
git commit -m "Mejora / descripción del cambio"
git push origin feature/descripcion-corta
# Crear Pull Request hacia main
```

## Proceso de Pull Request

1. **Prueba los cambios** en local (`npm run dev` y, si aplica, `npm run build`)
2. **Actualiza la documentación** si cambias comportamiento o instalación
3. **Crea un Pull Request** desde tu rama hacia `main`
4. **Describe claramente** los cambios realizados
5. **Espera revisión** de al menos un maintainer

### Checklist para PR

- [ ] Código probado localmente en `frontend`
- [ ] `npm run lint` sin errores nuevos (si aplica)
- [ ] `npm run build` exitoso (si tocaste rutas o componentes principales)
- [ ] Documentación actualizada (`README.md` o `Docs/` si aplica)
- [ ] Commits limpios y descriptivos
- [ ] El PR describe qué cambió y por qué

## Reportar Issues

Antes de reportar un issue:

1. **Busca issues existentes** relacionados
2. **Proporciona información detallada**:
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Entorno (SO, navegador, versión de Node — 22.15.0 o superior)
   - Capturas o logs si aplican

## Testing

Por ahora el proyecto no incluye una suite de tests automatizada. Antes de enviar un PR:

- Verifica manualmente el mapa, filtros y marcadores en el navegador
- Ejecuta `npm run lint` y `npm run build` en `frontend`

Si añades tests en el futuro, documenta cómo ejecutarlos en esta sección.

## Documentación

- Mantén el **[README.md](../README.md)** actualizado
- Añade o actualiza archivos en **`Docs/`** para guías más detalladas
- Usa comentarios en el código solo cuando la lógica no sea obvia

## Comunidad y Contacto

- **Issues**: Preguntas técnicas y reportes de bugs
- **Discussions** (si está habilitado en el repo): Ideas generales

## Reconocimiento

¡Todas las contribuciones son valoradas! Los colaboradores pueden ser reconocidos en el README y en releases.

---

¡Gracias por contribuir a MIC! Tu ayuda mejora el mapa interactivo de Cabimas para todos.
