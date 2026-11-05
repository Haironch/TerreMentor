import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { getSismos } from './api/_lib/fetchSismos.js'
import { getClima } from './api/_lib/fetchClima.js'
import { getVolcanes } from './api/_lib/fetchVolcanes.js'
import { getWorldQuakes } from './api/_lib/fetchWorldQuakes.js'
import { getQuakeYears } from './api/_lib/fetchQuakeYears.js'
import { getQuakeTrend } from './api/_lib/fetchQuakeTrend.js'

// Simula en desarrollo la función serverless de api/sismos.js (que en
// producción correría en Vercel/Cloudflare). Así `npm run dev` sirve datos
// reales sin necesitar `vercel dev`.
function sismosApiDevMiddleware() {
  return {
    name: 'sismos-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/sismos', async (req, res) => {
        try {
          const force = new URL(req.url, 'http://localhost').searchParams.get('force') === '1'
          const data = await getSismos({ force })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener datos de INSIVUMEH', detail: err.message }))
        }
      })
    },
  }
}

function climaApiDevMiddleware() {
  return {
    name: 'clima-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/clima', async (req, res) => {
        try {
          const departamento = new URL(req.url, 'http://localhost').searchParams.get('departamento')
          if (!departamento) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Falta el parámetro departamento' }))
            return
          }
          const data = await getClima(departamento)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener el clima', detail: err.message }))
        }
      })
    },
  }
}

function volcanesApiDevMiddleware() {
  return {
    name: 'volcanes-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/volcanes', async (req, res) => {
        try {
          const data = await getVolcanes()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener el estado volcánico', detail: err.message }))
        }
      })
    },
  }
}

const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  devOptions: { enabled: true, type: 'module' },
  includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
  manifest: {
    name: 'TerreMentor · Monitoreo sísmico comunitario',
    short_name: 'TerreMentor',
    description: 'Monitoreo comunitario de sismos en Guatemala y Centroamérica, con datos públicos de INSIVUMEH.',
    lang: 'es-GT',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#0a0d12',
    background_color: '#0a0d12',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /\/api\/sismos(\?.*)?$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'sismos-api',
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/Canvas\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/api\/clima(\?.*)?$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'clima-api',
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 22, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

function worldQuakesApiDevMiddleware() {
  return {
    name: 'world-quakes-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/world-quakes', async (req, res) => {
        try {
          const force = new URL(req.url, 'http://localhost').searchParams.get('force') === '1'
          const data = await getWorldQuakes({ force })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener datos del USGS', detail: err.message }))
        }
      })
    },
  }
}

function quakeYearsApiDevMiddleware() {
  return {
    name: 'quake-years-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/quake-years', async (req, res) => {
        try {
          const force = new URL(req.url, 'http://localhost').searchParams.get('force') === '1'
          const data = await getQuakeYears({ force })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener datos del USGS', detail: err.message }))
        }
      })
    },
  }
}

function quakeTrendApiDevMiddleware() {
  return {
    name: 'quake-trend-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/quake-trend', async (req, res) => {
        try {
          const force = new URL(req.url, 'http://localhost').searchParams.get('force') === '1'
          const data = await getQuakeTrend({ force })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'No se pudo obtener datos del USGS', detail: err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sismosApiDevMiddleware(),
    climaApiDevMiddleware(),
    volcanesApiDevMiddleware(),
    worldQuakesApiDevMiddleware(),
    quakeYearsApiDevMiddleware(),
    quakeTrendApiDevMiddleware(),
    pwaPlugin,
  ],
})
