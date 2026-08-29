const fs = require('fs');
const path = require('path');

// Verificar versão do Node.js e usar fetch apropriado
let fetch;
if (typeof globalThis.fetch === 'function') {
  // Node.js 18+ tem fetch nativo
  fetch = globalThis.fetch;
} else {
  // Para versões anteriores, tentar usar node-fetch
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ Erro: É necessário Node.js 18+ ou instalar node-fetch');
    console.error('   Instale com: npm install node-fetch@2');
    process.exit(1);
  }
}

// Configurações do mapa - limites ajustados para área terrestre visível
// Evitando o oceano à esquerda (oeste) e mantendo apenas área terrestre
// Formato: [[lat_min, lon_min], [lat_max, lon_max]]
// Limites mais restritos para evitar rotas no oceano
const maxBounds = [[10.35, -71.50], [10.48, -71.35]];
const distanciaMinimaEntreRutas = 0.5; // km
const distanciaMinimaEntrePuntos = 0.3; // km

// Cores para as rotas
const colores = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', 
  '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088',
  '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff',
  '#44ffff', '#ffaa44', '#aa44ff', '#44ffaa', '#ff44aa',
  '#cc0000', '#00cc00', '#0000cc', '#cccc00', '#cc00cc',
  '#00cccc', '#cc8800', '#8800cc', '#00cc88', '#cc0088'
];

// Função para calcular distância entre dois pontos (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
}

// Função para calcular tiempo medio
function calcularTiempoMedio(distancia) {
  const velocidadPromedio = 30; // km/h
  const tiempoHoras = distancia / velocidadPromedio;
  const horas = Math.floor(tiempoHoras);
  const minutos = Math.round((tiempoHoras - horas) * 60);
  
  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }
  return `${minutos}min`;
}

// Função para verificar se um ponto está dentro de los límites
function estaDentroDeLimites(lat, lng) {
  const [southWest, northEast] = maxBounds;
  return lat >= southWest[0] && lat <= northEast[0] && 
         lng >= southWest[1] && lng <= northEast[1];
}

// Función para generar un punto aleatorio dentro de los límites
function generarPuntoAleatorio() {
  const [southWest, northEast] = maxBounds;
  const lat = southWest[0] + Math.random() * (northEast[0] - southWest[0]);
  const lng = southWest[1] + Math.random() * (northEast[1] - southWest[1]);
  return [lat, lng];
}

// Función para obtener el punto más cercano en una calle usando OSRM
async function obtenerPuntoEnCalle(lat, lon) {
  try {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
      const waypoint = data.waypoints[0];
      // OSRM devuelve [lon, lat], convertir a [lat, lon]
      return [waypoint.location[1], waypoint.location[0]];
    }
    return [lat, lon];
  } catch (error) {
    console.error('Error al obtener punto en calle:', error);
    return [lat, lon];
  }
}

// Función para obtener punto en calle y verificar que esté dentro de límites
async function obtenerPuntoEnCalleDentroDeLimites(lat, lng, maxIntentos = 5) {
  for (let intento = 0; intento < maxIntentos; intento++) {
    const puntoEnCalle = await obtenerPuntoEnCalle(lat, lng);
    
    if (estaDentroDeLimites(puntoEnCalle[0], puntoEnCalle[1])) {
      return puntoEnCalle;
    }
    
    if (intento < maxIntentos - 1) {
      const [southWest, northEast] = maxBounds;
      const centroLat = (southWest[0] + northEast[0]) / 2;
      const centroLng = (southWest[1] + northEast[1]) / 2;
      const factor = 0.7 - (intento * 0.1);
      const nuevoLat = centroLat + (lat - centroLat) * factor;
      const nuevoLng = centroLng + (lng - centroLng) * factor;
      lat = nuevoLat;
      lng = nuevoLng;
    }
  }
  
  const puntoEnCalle = await obtenerPuntoEnCalle(lat, lng);
  if (estaDentroDeLimites(puntoEnCalle[0], puntoEnCalle[1])) {
    return puntoEnCalle;
  }
  
  const [southWest, northEast] = maxBounds;
  const centroLat = (southWest[0] + northEast[0]) / 2;
  const centroLng = (southWest[1] + northEast[1]) / 2;
  return await obtenerPuntoEnCalle(centroLat, centroLng);
}

// Función para obtener la ruta real usando OSRM
async function obtenerRuta(lat1, lon1, lat2, lon2) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      const distanciaKm = route.distance / 1000;
      
      return {
        coordinates,
        distancia: distanciaKm,
        duracion: route.duration
      };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    return null;
  }
}

// Función para verificar si una ruta está suficientemente lejos de otras rutas
function esRutaSuficientementeLejos(nuevaRuta, rutasExistentes) {
  if (rutasExistentes.length === 0) return true;
  
  for (const rutaExistente of rutasExistentes) {
    const distA = calcularDistancia(
      nuevaRuta.puntoA[0], nuevaRuta.puntoA[1],
      rutaExistente.puntoA[0], rutaExistente.puntoA[1]
    );
    
    const distB = calcularDistancia(
      nuevaRuta.puntoB[0], nuevaRuta.puntoB[1],
      rutaExistente.puntoB[0], rutaExistente.puntoB[1]
    );
    
    const distAB = calcularDistancia(
      nuevaRuta.puntoA[0], nuevaRuta.puntoA[1],
      rutaExistente.puntoB[0], rutaExistente.puntoB[1]
    );
    
    const distBA = calcularDistancia(
      nuevaRuta.puntoB[0], nuevaRuta.puntoB[1],
      rutaExistente.puntoA[0], rutaExistente.puntoA[1]
    );
    
    if (distA < distanciaMinimaEntreRutas || distB < distanciaMinimaEntreRutas || 
        distAB < distanciaMinimaEntreRutas || distBA < distanciaMinimaEntreRutas) {
      return false;
    }
  }
  
  return true;
}

// Función principal para generar rutas
async function generarRutas() {
  console.log('🚀 Iniciando geração de 30 rotas...\n');
  
  const rutasDir = path.join(__dirname, '..', 'data', 'rutas');
  
  // Criar pasta se não existir
  if (!fs.existsSync(rutasDir)) {
    fs.mkdirSync(rutasDir, { recursive: true });
    console.log(`📁 Pasta criada: ${rutasDir}\n`);
  }
  
  const nuevasRutas = [];
  const paresUsados = new Set();
  let intentosGenerales = 0;
  const maxIntentosGenerales = 1000;
  
  for (let i = 0; i < 30 && intentosGenerales < maxIntentosGenerales; i++) {
    let rutaValida = false;
    let intentosRuta = 0;
    const maxIntentosPorRuta = 50;
    
    console.log(`📍 Gerando rota ${i + 1}/30...`);
    
    while (!rutaValida && intentosRuta < maxIntentosPorRuta && intentosGenerales < maxIntentosGenerales) {
      intentosRuta++;
      intentosGenerales++;
      
      // Gerar pontos aleatorios
      const puntoAleatorioA = generarPuntoAleatorio();
      const puntoAleatorioB = generarPuntoAleatorio();
      
      // Obter pontos em ruas (em paralelo)
      const [puntoAEnCalle, puntoBEnCalle] = await Promise.all([
        obtenerPuntoEnCalleDentroDeLimites(puntoAleatorioA[0], puntoAleatorioA[1]),
        obtenerPuntoEnCalleDentroDeLimites(puntoAleatorioB[0], puntoAleatorioB[1])
      ]);
      
      // Verificar que ambos pontos estejam dentro de límites
      if (!estaDentroDeLimites(puntoAEnCalle[0], puntoAEnCalle[1]) || 
          !estaDentroDeLimites(puntoBEnCalle[0], puntoBEnCalle[1])) {
        continue;
      }
      
      // Verificar que a distância entre A e B seja razoável
      const distanciaAB = calcularDistancia(
        puntoAEnCalle[0], puntoAEnCalle[1], 
        puntoBEnCalle[0], puntoBEnCalle[1]
      );
      
      if (distanciaAB < distanciaMinimaEntrePuntos) {
        continue;
      }
      
      // Criar chave única para o par
      const puntoAKey = `${puntoAEnCalle[0].toFixed(4)},${puntoAEnCalle[1].toFixed(4)}`;
      const puntoBKey = `${puntoBEnCalle[0].toFixed(4)},${puntoBEnCalle[1].toFixed(4)}`;
      const parKey = puntoAKey < puntoBKey ? `${puntoAKey}-${puntoBKey}` : `${puntoBKey}-${puntoAKey}`;
      
      // Verificar que o par não tenha sido usado
      if (paresUsados.has(parKey)) {
        continue;
      }
      
      // Criar objeto de ruta temporal
      const rutaTemporal = {
        puntoA: puntoAEnCalle,
        puntoB: puntoBEnCalle
      };
      
      // Verificar que esteja suficientemente longe de outras rotas
      if (!esRutaSuficientementeLejos(rutaTemporal, nuevasRutas)) {
        continue;
      }
      
      // Obter a ruta real usando OSRM
      const routeData = await obtenerRuta(
        puntoAEnCalle[0], puntoAEnCalle[1], 
        puntoBEnCalle[0], puntoBEnCalle[1]
      );
      
      if (routeData && routeData.distancia >= distanciaMinimaEntrePuntos) {
        // Filtrar coordenadas dentro de límites - garantir que TODAS as coordenadas estejam dentro
        const coordenadasFiltradas = routeData.coordinates.filter(coord => 
          estaDentroDeLimites(coord[0], coord[1])
        );
        
        // Verificar que pelo menos 90% das coordenadas estejam dentro dos limites
        // Isso garante que a rota não saia muito da área visível
        const porcentajeDentro = coordenadasFiltradas.length / routeData.coordinates.length;
        
        if (coordenadasFiltradas.length >= 2 && porcentajeDentro >= 0.9) {
          const tienePuntoA = coordenadasFiltradas.some(coord => 
            calcularDistancia(coord[0], coord[1], puntoAEnCalle[0], puntoAEnCalle[1]) < 0.01
          );
          const tienePuntoB = coordenadasFiltradas.some(coord => 
            calcularDistancia(coord[0], coord[1], puntoBEnCalle[0], puntoBEnCalle[1]) < 0.01
          );
          
          if (tienePuntoA && tienePuntoB) {
            // Ruta válida encontrada
            paresUsados.add(parKey);
            
            const ruta = {
              id: i,
              puntoA: puntoAEnCalle,
              puntoB: puntoBEnCalle,
              nombreA: `Ponto A${i + 1}`,
              nombreB: `Ponto B${i + 1}`,
              coordinates: coordenadasFiltradas,
              distancia: routeData.distancia,
              duracion: routeData.duracion,
              color: colores[i % colores.length],
              tiempo: calcularTiempoMedio(routeData.distancia)
            };
            
            nuevasRutas.push(ruta);
            
            // Salvar rota em arquivo individual
            const rutaFileName = `ruta-${String(i + 1).padStart(2, '0')}.json`;
            const rutaFilePath = path.join(rutasDir, rutaFileName);
            fs.writeFileSync(rutaFilePath, JSON.stringify(ruta, null, 2), 'utf8');
            
            console.log(`  ✅ Rota ${i + 1} salva: ${rutaFileName}`);
            console.log(`     Distância: ${ruta.distancia.toFixed(2)} km | Tempo: ${ruta.tiempo}\n`);
            
            rutaValida = true;
          }
        }
      }
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!rutaValida) {
      console.log(`  ⚠️  Não foi possível gerar a rota ${i + 1} após ${intentosRuta} tentativas\n`);
    }
  }
  
  // Salvar arquivo com todas as rotas
  const todasRotasPath = path.join(rutasDir, 'todas-rotas.json');
  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  const publicRutasPath = path.join(publicDataDir, 'rutas.json');
  const rutasJson = JSON.stringify(nuevasRutas, null, 2);

  fs.writeFileSync(todasRotasPath, rutasJson, 'utf8');

  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  fs.writeFileSync(publicRutasPath, rutasJson, 'utf8');

  console.log(`\n✨ Geração concluída!`);
  console.log(`📊 Total de rotas geradas: ${nuevasRutas.length}/30`);
  console.log(`📁 Rotas salvas em: ${rutasDir}`);
  console.log(`📄 Arquivo consolidado: todas-rotas.json`);
  console.log(`🌐 Asset estático: ${publicRutasPath}\n`);
  
  if (nuevasRutas.length < 30) {
    console.log(`⚠️  Aviso: Apenas ${nuevasRutas.length} rotas foram geradas de 30 solicitadas.`);
    console.log(`   Isso pode acontecer devido a limitações da API ou área do mapa.\n`);
  }
}

// Executar o script
generarRutas().catch(error => {
  console.error('❌ Erro ao gerar rotas:', error);
  process.exit(1);
});
