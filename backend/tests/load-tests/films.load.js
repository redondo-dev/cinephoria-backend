import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // montée à 10 users
    { duration: '20s', target: 10 },  // maintien 20s
    { duration: '10s', target: 0 },   // descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 2000ms
    http_req_failed: ['rate<0.01'],    // moins de 1% d'erreurs
  },
}

export default function () {
  const res = http.get('http://localhost:3000/api/films?page=1&limit=20')

  check(res, {
    'status 200': (r) => r.status === 200,
    'body non vide': (r) => r.body.length > 0,
    'temps réponse < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}