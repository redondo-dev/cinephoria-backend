'use strict';

/**
 * Alignement de l'integrite de la base (suite de 20260901120000-fix-billet-table.cjs) :
 *  - supprime l'ancienne contrainte unique_siege_par_seance (non partielle) ;
 *  - cree l'index partiel unique_siege_actif_par_seance s'il manque ;
 *  - ajoute les cles etrangeres absentes, en mode NOT VALID.
 * Le SQL est dans sql/alignement-integrite.sql ; chaque etape est ignoree si elle est
 * deja appliquee, la migration peut donc s'executer sur n'importe quelle base.
 */
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    const sqlPath = path.join(__dirname, 'sql', 'alignement-integrite.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.siege      DROP CONSTRAINT IF EXISTS fk_siege_salle;
      ALTER TABLE public.seance     DROP CONSTRAINT IF EXISTS fk_seance_film;
      ALTER TABLE public.film_genre DROP CONSTRAINT IF EXISTS fk_film_genre_film;
      ALTER TABLE public.film_genre DROP CONSTRAINT IF EXISTS fk_film_genre_genre;
      ALTER TABLE public.avis       DROP CONSTRAINT IF EXISTS fk_avis_film;
    `);
    // unique_siege_par_seance n'est volontairement pas recreee : elle empechait de
    // reserver a nouveau un siege dont le billet est annule. fk_avis_film existait deja
    // sur certaines bases avant cette migration : son retrait par down() est sans gravite.
  },
};
