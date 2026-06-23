// backend/load-tests/spike.load.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '30s', target: 10 },    // trafic normal
    { duration: '10s', target: 5000 },  // PIC BRUTAL — simulation sortie de film
    { duration: '1m',  target: 5000 },  // maintien du pic
    { duration: '10s', target: 10 },    // retour normal
    { duration: '30s', target: 10 },    // stabilisation
    { duration: '10s', target: 0 },     // fin
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 10s max pendant le pic
    http_req_failed: ['rate<0.20'],     // max 20% erreurs pendant le pic
  },
}

const BASE_URL = 'http://localhost:3000/api'

export default function () {
  // Simule le comportement lors d'une sortie de film très attendue
  const res = http.get(`${BASE_URL}/films?page=1&limit=20`)

  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'répond en moins de 10s': (r) => r.timings.duration < 10000,
  })

  errorRate.add(!success)

  // Pas de sleep — simule un pic brutal sans pause
  sleep(0.1)
}

export function handleSummary(data) {
  const metrics = data.metrics

  console.log('\n=== RÉSULTATS SPIKE TEST ===')
  console.log(`Requêtes totales : ${metrics.http_reqs.values.count}`)
  console.log(`Taux d'erreur   : ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%`)
  console.log(`Temps moyen     : ${metrics.http_req_duration.values.avg.toFixed(0)}ms`)
  console.log(`p(95)           : ${metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`)

  return {
    'results/spike-results.json': JSON.stringify(data, null, 2),
  }
}