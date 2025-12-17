import dynamic from 'next/dynamic'

const Mapa = dynamic(() => import('../components/Mapa'), { ssr: false })

export default function Home() {
  return (
    <main>
      <h1 style={{ textAlign: 'center', padding: '20px' }}>Mapa Interactivo de Hospitales en Cabimas</h1>
      <Mapa />
    </main>
  )
}