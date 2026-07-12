// backend/load-tests/stress.load.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // montée normale
    { duration: '5m', target: 100 },   // charge stable
    { duration: '2m', target: 200 },   // montée stress
    { duration: '5m', target: 200 },   // maintien stress
    { duration: '2m', target: 300 },   // montée critique
    { duration: '5m', target: 300 },   // maintien critique
    { duration: '2m', target: 400 },   // vers la limite
    { duration: '5m', target: 400 },   // maintien limite
    { duration: '2m', target: 0 },     // descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 5s max sous stress
    http_req_failed: ['rate<0.10'],    // max 10% erreurs acceptées
    errors: ['rate<0.10'],
  },
}

const BASE_URL = 'http://localhost:3000/api'

export default function () {
  // Mix réaliste de requêtes
  const requests = [
    () => http.get(`${BASE_URL}/films?page=1&limit=20`),
    () => http.get(`${BASE_URL}/films?page=2&limit=20`),
    () => http.get(`${BASE_URL}/cinemas`),
    () => http.get(`${BASE_URL}/seances/dates`),
  ]

  const randomReq = requests[Math.floor(Math.random() * requests.length)]
  const res = randomReq()

  const success = check(res, {
    'status ok': (r) => r.status === 200,
    'pas de timeout': (r) => r.timings.duration < 5000,
  })

  errorRate.add(!success)
  responseTime.add(res.timings.duration)

  sleep(Math.random() * 2) // pause aléatoire 0-2s
}

export function handleSummary(data) {
  return {
    'results/stress-results.json': JSON.stringify(data, null, 2),
  }
}