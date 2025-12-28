import { readFile, readdir, access } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // O caminho correto é relativo ao diretório do projeto Next.js (frontend)
    // process.cwd() retorna o diretório onde o Next.js foi iniciado (geralmente 'frontend')
    const rutasDir = join(process.cwd(), 'data', 'rutas')
    
    console.log('🔍 Buscando rotas em:', rutasDir)
    console.log('📂 process.cwd():', process.cwd())
    
    // Verificar se o diretório existe
    try {
      await access(rutasDir)
    } catch (accessError) {
      console.error('❌ Diretório não encontrado:', rutasDir)
      return Response.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    // Primeiro, tentar carregar o arquivo consolidado
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
      // Se o arquivo consolidado não existe, continuar para carregar arquivos individuais
      if (fileError.code !== 'ENOENT') {
        console.warn('⚠️ Error reading todas-rotas.json:', fileError.message)
      }
    }
    
    // Carregar rotas individuais (ruta-01.json, ruta-02.json, etc.)
    try {
      const files = await readdir(rutasDir)
      console.log(`📁 Arquivos encontrados no diretório:`, files.length)
      
      const rutaFiles = files
        .filter(file => file.startsWith('ruta-') && file.endsWith('.json'))
        .sort((a, b) => {
          // Ordenar por número: ruta-01.json, ruta-02.json, etc.
          const numA = parseInt(a.match(/\d+/)?.[0] || '0')
          const numB = parseInt(b.match(/\d+/)?.[0] || '0')
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
      
      // Ler todos os arquivos de rota em paralelo
      const rutasPromises = rutaFiles.map(async (file) => {
        try {
          const filePath = join(rutasDir, file)
          const fileContents = await readFile(filePath, 'utf8')
          const ruta = JSON.parse(fileContents)
          console.log(`✅ Carregada rota: ${file}`)
          return ruta
        } catch (error) {
          console.error(`❌ Error reading ${file}:`, error.message)
          return null
        }
      })
      
      const rutas = (await Promise.all(rutasPromises)).filter(ruta => ruta !== null)
      
      console.log(`✅ Total de rotas carregadas: ${rutas.length}`)
      
      return Response.json(rutas, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (dirError) {
      console.error('❌ Error reading routes directory:', dirError.message)
      console.error('Stack:', dirError.stack)
      return Response.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    console.error('❌ Error loading routes:', error.message)
    console.error('Stack:', error.stack)
    return Response.json(
      { error: 'Error al cargar las rutas', message: error.message },
      { status: 500 }
    )
  }
}
