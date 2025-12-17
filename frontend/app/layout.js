import './globals.css'

export const metadata = {
  title: 'Mapa de Hospitales Cabimas',
  description: 'Mapa interactivo de hospitales en Cabimas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}