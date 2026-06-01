import { readFile, readdir, access } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const rutasDir = join(process.cwd(), 'data', 'rutas')

    console.log('🔍 Buscando rotas em:', rutasDir)
    console.log('📂 process.cwd():', process.cwd())

    try {
      await access(rutasDir)
    } catch {
      console.error('❌ Diretório não encontrado:', rutasDir)
      return Response.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const todasRotasPath = join(rutasDir, 'todas-rotas.json')
    try {
      const fileContents = await readFile(todasRotasPath, 'utf8')
      const rutas = JSON.parse(fileContents)

      if (Array.isArray(rutas) && rutas.length > 0) {
        console.log(`✅ Carregadas ${rutas.length} rotas do arquivo consolidado`)
        return Response.json(rutas, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (fileError) {
      const err = fileError as NodeJS.ErrnoException
      if (err.code !== 'ENOENT') {
        console.warn('⚠️ Error reading todas-rotas.json:', err.message)
      }
    }

    try {
      const files = await readdir(rutasDir)
      console.log(`📁 Arquivos encontrados no diretório:`, files.length)

      const rutaFiles = files
        .filter((file) => file.startsWith('ruta-') && file.endsWith('.json'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10)
          const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10)
          return numA - numB
        })

      console.log(`📄 Arquivos de rota encontrados:`, rutaFiles.length)

      if (rutaFiles.length === 0) {
        console.log('⚠️ Nenhum arquivo de rota encontrado')
        return Response.json([], {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const rutasPromises = rutaFiles.map(async (file) => {
        try {
          const filePath = join(rutasDir, file)
          const fileContents = await readFile(filePath, 'utf8')
          const ruta = JSON.parse(fileContents)
          console.log(`✅ Carregada rota: ${file}`)
          return ruta
        } catch (error) {
          const err = error as Error
          console.error(`❌ Error reading ${file}:`, err.message)
          return null
        }
      })

      const rutas = (await Promise.all(rutasPromises)).filter((ruta) => ruta !== null)

      console.log(`✅ Total de rotas carregadas: ${rutas.length}`)

      return Response.json(rutas, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (dirError) {
      const err = dirError as Error
      console.error('❌ Error reading routes directory:', err.message)
      console.error('Stack:', err.stack)
      return Response.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    const err = error as Error
    console.error('❌ Error loading routes:', err.message)
    console.error('Stack:', err.stack)
    return Response.json(
      { error: 'Error al cargar las rutas', message: err.message },
      { status: 500 }
    )
  }
}
