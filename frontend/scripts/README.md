# Script de Geração de Rotas

Este script gera 30 rotas diferentes e as salva em arquivos JSON na pasta `data/rutas/`.

## Como usar

### Opção 1: Usando npm
```bash
cd frontend
npm run gerar-rotas
```

### Opção 2: Executar diretamente
```bash
cd frontend
node scripts/gerar-rotas.js
```

## Requisitos

- Node.js 18+ (tem suporte nativo para `fetch`)
- Ou Node.js 14+ com `node-fetch` instalado:
  ```bash
  npm install node-fetch@2
  ```

## Saída

O script criará:
- Pasta `frontend/data/rutas/` (se não existir)
- 30 arquivos individuais: `ruta-01.json`, `ruta-02.json`, ..., `ruta-30.json`
- Um arquivo consolidado: `todas-rotas.json` com todas as rotas

## Formato das rotas

Cada arquivo JSON contém:
```json
{
  "id": 0,
  "puntoA": [10.4, -71.45],
  "puntoB": [10.42, -71.47],
  "nombreA": "Ponto A1",
  "nombreB": "Ponto B1",
  "coordinates": [[10.4, -71.45], [10.401, -71.451], ...],
  "distancia": 2.5,
  "duracion": 300,
  "color": "#ff0000",
  "tiempo": "5min"
}
```

## Notas

- O script usa a API pública do OSRM (Open Source Routing Machine)
- Pode levar alguns minutos para gerar todas as 30 rotas
- Se algumas rotas não puderem ser geradas, o script continuará tentando até completar o máximo possível
