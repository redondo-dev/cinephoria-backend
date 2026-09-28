// src/seeders/run.seeder.js
// Charge l'environnement comme le reste du projet : .env.development en local,
// variables du workflow en CI. L'ancien `import 'dotenv/config'` lisait `.env`,

import '../config/env.js'
import sequelize from '../config/database.js'
import { seedTestData, cleanTestData } from './test.seeder.js'
import { seedRoles } from './role.seeder.js'
import { seedReferenceData } from './reference.seeder.js'

const action = process.argv[2] // 'seed' ou 'clean'

const HOTES_LOCAUX = ['localhost', '127.0.0.1', '::1']

// Refuse de tourner sur une base distante, sauf demande explicite.
function verifierBaseLocale() {
  const host = sequelize.config.host
  if (!HOTES_LOCAUX.includes(host) && process.env.ALLOW_REMOTE_SEED !== '1') {
    console.error(`❌ Refus : la base visée est distante (${host}).`)
    console.error("   Pour l'autoriser volontairement : ALLOW_REMOTE_SEED=1")
    process.exit(1)
  }
}

async function run() {
  try {
    verifierBaseLocale()
    await sequelize.authenticate()
    console.log('✅ Connexion DB OK')
    if (action === 'seed') {
      await seedRoles()
      await seedReferenceData()
      await seedTestData()
    } else if (action === 'clean') {
      await cleanTestData()
    } else {
      console.log('Usage: node run.seeder.js seed|clean')
    }
    await sequelize.close()
    process.exit(0)
  } catch (err) {
    console.error('❌ Erreur:', err.message)
    process.exit(1)
  }
}
run()