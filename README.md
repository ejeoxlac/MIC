# Mapa Interactivo de Hospitales en Cabimas

Una aplicación web que muestra un mapa interactivo offline de Cabimas con ubicaciones de hospitales locales y otras entidades publicas.

## Características

- Mapa offline usando tiles descargados
- Filtro para alternar entre servicios de salud, seguridad, bomberos y gobierno
- Marcadores con íconos personalizados: 🏥 (verde) para salud, 🚓 (azul) para seguridad, 🚒 (rojo) para bomberos, 🏛️ (morado) para gobierno
- Pin personalizable y arrastrable para obtener coordenadas
- Zoom limitado entre 13 y 16
- Navegación restringida al área de Cabimas

## Tecnologías

- Next.js
- React
- Leaflet
- React-Leaflet

## Instalación

1. Clona el repositorio
2. Navega a la carpeta `frontend`
3. Ejecuta `npm install`
4. Ejecuta `npm run dev`
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Uso

- Usa los botones de filtro en la parte superior izquierda para alternar entre "Salud", "Seguridad", "Bomberos" y "Gobierno"
- Haz zoom y navega por el mapa de Cabimas
- Haz clic en los pines de hospitales o estaciones de policía para ver información
- Usa el botón "Agregar Pin" para colocar un marcador personalizable; cambia a "Eliminar Pin" para removerlo
- Arrastra el pin personalizado para actualizar coordenadas en tiempo real
