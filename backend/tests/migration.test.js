// backend/tests/migrations.test.js
import sequelize  from '../src/config/database.js'

describe('Tests migrations PostgreSQL Render', () => {

  it('connexion à la base Render réussie', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow()
  })

  it('table utilisateur existe', async () => {
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'utilisateur'
      ) as exists
    `)
    expect(results[0].exists).toBe(true)
  })

  it('table reservation existe avec les bonnes colonnes', async () => {
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reservation'
      ORDER BY column_name
    `)
    const columnNames = columns.map(c => c.column_name)
    expect(columnNames).toContain('seance_id')
    expect(columnNames).toContain('nb_places')
    expect(columnNames).toContain('prix_unitaire')
    expect(columnNames).toContain('statut_reservation')
  })

  it('enum statut_reservation contient les bonnes valeurs', async () => {
    const [results] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'enum_reservation_statut_reservation'
      ORDER BY enumlabel
    `)
    const values = results.map(r => r.enumlabel)
    expect(values).toContain('en_attente')
    expect(values).toContain('confirmee')
    expect(values).toContain('annulee')
    expect(values).toContain('valide')
  })

  it('clés étrangères sont en place', async () => {
    const [results] = await sequelize.query(`
      SELECT constraint_name, table_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_name IN ('reservation', 'seance', 'siege')
    `)
    expect(results.length).toBeGreaterThan(0)
  })

  afterAll(async () => {
    await sequelize.close()
  })
})