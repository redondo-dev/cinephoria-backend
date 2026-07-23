// src/seeders/run.seeder.js
import 'dotenv/config'
import sequelize from '../config/database.js'
import { seedTestData, cleanTestData } from './test.seeder.js'
import { seedRoles } from './role.seeder.js'
import { seedReferenceData } from './reference.seeder.js'

const action = process.argv[2] // 'seed' ou 'clean'

async function run() {
  try {
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
