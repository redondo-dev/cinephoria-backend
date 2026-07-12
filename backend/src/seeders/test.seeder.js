// src/seeders/test.seeder.js
import bcrypt from 'bcrypt'
import {User } from '../models/index.js'

export const seedTestData = async () => {
  console.log('🌱 Insertion des données de test...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  
  const users = [
    { email: 'test@cinema.fr',    prenom: 'Test',    nom: 'Cypress', role_id: 1 },
    { email: 'admin@cinema.fr',   prenom: 'Admin',   nom: 'Test',    role_id: 2 },
    { email: 'employe@cinema.fr', prenom: 'Employe', nom: 'Test',    role_id: 3 },
  ]

  for (const u of users) {
    await User.upsert({
      ...u,
      password: hashedPassword,
      isConfirmed: true,          // ← force toujours à true
      mustChangePassword: false
    })
    console.log(`  ✓ ${u.email}`)
  }

  console.log('✅ Données de test insérées')
}

export const cleanTestData = async () => {
  console.log('🧹 Nettoyage...')
  await User.destroy({
    where: {
      email: ['test@cinema.fr', 'admin@cinema.fr', 'employe@cinema.fr']
    }
  })
  console.log('✅ Données supprimées')
}