// test-models.js
import { sequelize, Film, Seance, Salle, Cinema, Genre } from './src/models/index.js';

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('Connexion OK');

    // Synchroniser les tables sans écraser les données existantes
    await sequelize.sync({ alter: true });

    // Créer un cinéma test (si n'existe pas déjà)
    const [cinema] = await Cinema.findOrCreate({
      where: { nom: 'CineMax', ville: 'Paris' }
    });

    // Créer une salle test (si n'existe pas déjà)
    const [salle] = await Salle.findOrCreate({
      where: { nom_salle: 'Salle 1', cinema_id: cinema.id },
      defaults: { capacite: 100 }
    });

    // Créer un genre test (si nécessaire)
    const [genre] = await Genre.findOrCreate({
      where: { nom: 'Animation' }
    });

    // Créer un film test (si n'existe pas déjà)
    const [film] = await Film.findOrCreate({
      where: { titre: 'Le Roi Lion' },
      defaults: {
        description: 'Un jeune lion destiné à devenir roi affronte son destin.',
        affiche: 'roi_lion.jpg',
        age_min: 0,
        duree: 88,
        date_ajout: new Date(),
        coup_coeur: true,
        note_moyenne: 4.7,
        nb_avis: 10,
        genre_id: genre.id
      }
    });

    // Créer une séance pour le film (si n'existe pas déjà)
    const [seance] = await Seance.findOrCreate({
      where: {
        film_id: film.id,
        salle_id: salle.id,
        date_seance: new Date('2025-09-20T20:00:00')
      }
    });

    // Récupérer le film avec toutes ses relations
    const filmWithRelations = await Film.findOne({
      where: { id: film.id },
      include: [
        {
          model: Seance,
          as: 'seances',
          include: [
            {
              model: Salle,
              as: 'salle',
              include: [
                {
                  model: Cinema,
                  as: 'cinema'
                }
              ]
            }
          ]
        },
        {
          model: Genre,
          as: 'genre'
        }
      ]
    });

    console.log(JSON.stringify(filmWithRelations, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

createTestData();
