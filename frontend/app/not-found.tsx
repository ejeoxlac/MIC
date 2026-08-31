export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div>
        <h1>404</h1>
        <p>La página que buscas no existe.</p>
      </div>
    </main>
  )
}
