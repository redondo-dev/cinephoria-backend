import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // Temps de réponse global
    http_req_duration: ['p(95)<3000'],
    // Temps spécifique aux logins valides uniquement
    'http_req_duration{name:login_valide}': ['p(95)<2000'],
    // Erreurs uniquement sur les logins valides (pas les 401 attendus)
    'http_req_failed{name:login_valide}': ['rate<0.01'],
  },
}

const headers = { 'Content-Type': 'application/json' }

export default function () {

  const loginRes = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify({
      email: 'test@cinema.fr',
      password: 'password123',
      captchaToken: '10000000-aaaa-bbbb-cccc-000000000001',
    }),
    { headers, tags: { name: 'login_valide' } }
  )

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'token présent': (r) => {
      try { return JSON.parse(r.body).token !== undefined }
      catch { return false }
    },
    'temps login < 2000ms': (r) => r.timings.duration < 2000,
  })

  sleep(1)

  const badLoginRes = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify({
      email: 'test@cinema.fr',
      password: 'mauvais_password',
      captchaToken: '10000000-aaaa-bbbb-cccc-000000000001',
    }),
    { headers, tags: { name: 'login_invalide' } }
  )

  check(badLoginRes, {
    'mauvais mdp retourne 401': (r) => r.status === 401,
    'temps réponse < 3000ms': (r) => r.timings.duration < 3000,
  })

  sleep(2)
}