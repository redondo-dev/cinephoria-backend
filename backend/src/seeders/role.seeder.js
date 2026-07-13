// src/seeders/role.seeder.js
import { Role } from '../models/index.js'

export const seedRoles = async () => {
  const roles = [
    { id: 1, nom_role: 'client' },
    { id: 2, nom_role: 'admin' },
    { id: 3, nom_role: 'employe' },
    { id: 4, nom_role: 'visiteur' },
  ]
  for (const r of roles) {
    await Role.upsert(r)
  }
  console.log('✅ Roles seedés')
}