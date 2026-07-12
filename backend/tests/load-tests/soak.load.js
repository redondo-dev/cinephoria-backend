// backend/load-tests/soak.load.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time_trend')
const totalRequests = new Counter('total_requests')

export const options = {
  stages: [
    { duration: '5m',  target: 50 },   // montée progressive
    // { duration: '2h',  target: 50 },   // 2h de charge continue ← prod
    { duration: '10m', target: 50 }, // ← version courte pour test local
    { duration: '5m',  target: 0 },    // descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // doit rester stable sur 2h
    http_req_failed: ['rate<0.01'],     // 0% erreurs sur la durée
    errors: ['rate<0.01'],
  },
}

const BASE_URL = 'http://localhost:3000/api'
const headers = { 'Content-Type': 'application/json' }

// Scénario utilisateur complet
export default function () {
  // 1 — Consultation des films
  const filmsRes = http.get(`${BASE_URL}/films?page=1&limit=20`)
  check(filmsRes, { 'films status 200': (r) => r.status === 200 })
  totalRequests.add(1)
  responseTime.add(filmsRes.timings.duration)
  sleep(2)

  // 2 — Consultation d'un film spécifique
  const filmRes = http.get(`${BASE_URL}/films/1`)
  check(filmRes, { 'film detail ok': (r) => r.status === 200 || r.status === 404 })
  totalRequests.add(1)
  sleep(1)

  // 3 — Consultation des cinémas
  const cinemasRes = http.get(`${BASE_URL}/cinemas`)
  check(cinemasRes, { 'cinemas ok': (r) => r.status === 200 })
  totalRequests.add(1)
  sleep(1)

  errorRate.add(
    filmsRes.status !== 200 ||
    cinemasRes.status !== 200
  )

  sleep(Math.random() * 3 + 1) // pause réaliste 1-4s entre actions
}

export function handleSummary(data) {
  const metrics = data.metrics
  const duration = data.state?.testRunDurationMs 
    ? (data.state.testRunDurationMs / 1000 / 60).toFixed(1) 
    : 'N/A'

  const avg = metrics.http_req_duration?.values?.avg?.toFixed(0) ?? 'N/A'
  const p95 = metrics.http_req_duration?.values?.['p(95)']?.toFixed(0) ?? 'N/A'
  const p99 = metrics.http_req_duration?.values?.['p(99)']?.toFixed(0) ?? 'N/A'
  const errorRate = metrics.http_req_failed?.values?.rate != null
    ? (metrics.http_req_failed.values.rate * 100).toFixed(3)
    : 'N/A'
  const total = metrics.http_reqs?.values?.count ?? 'N/A'
  const avgNum = metrics.http_req_duration?.values?.avg ?? 0
  
  const report = {
    duree_test: `${duration} minutes`,
    total_requetes: total,
    taux_erreur: `${errorRate}%`,
    temps_moyen: `${avg}ms`,
    p95: `${p95}ms`,
    p99: `${p99}ms`,
    degrade: avgNum > 500 ? 'OUI' : 'NON',
  }

  console.log('\n=== RAPPORT SOAK TEST ===')
  Object.entries(report).forEach(([k, v]) => console.log(`${k}: ${v}`))

  return {
    'results/soak-report.json': JSON.stringify(report, null, 2),
  }
}