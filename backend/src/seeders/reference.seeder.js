// src/seeders/reference.seeder.js
import { Cinema, Salle, Film, Genre, FilmGenre, Seance, Tarif } from '../models/index.js'

export const seedReferenceData = async () => {
  // Cinema
  const [cinema] = await Cinema.findOrCreate({
    where: { nom: 'Cinephoria Test' },
    defaults: { nom: 'Cinephoria Test', ville: 'Paris' }
  })

  // Salle
  const [salle] = await Salle.findOrCreate({
    where: { nom: 'Salle Test 1' },
    defaults: {
      nom: 'Salle Test 1',
      nombrePlaces: 100,
      cinema_id: cinema.id,
      qualiteProjection: 'Standard'
    }
  })

  // Genre
  const [genre] = await Genre.findOrCreate({
    where: { nom: 'Action' },
    defaults: { nom: 'Action', description: 'Films d\'action' }
  })

  // Film
  const [film] = await Film.findOrCreate({
    where: { titre: 'Film Test Cypress' },
    defaults: {
      titre: 'Film Test Cypress',
      description: 'Film utilise pour les tests automatises',
      duree: 120,
      age_min: 0,
      coup_coeur: false
    }
  })

  // Association film <-> genre
  await FilmGenre.findOrCreate({
    where: { film_id: film.id, genre_id: genre.id }
  })

// Tarif par défaut (requis par createReservation pour créer les billets)
  await Tarif.findOrCreate({
    where: { nom_tarif: 'Normal' },
    defaults: {
      nom_tarif: 'Normal',
      type_tarif: 'normal',
      prix_unitaire: 9.90,
      description: 'Tarif standard de test'
    }
  })

 // Séance ID 1 (utilisée par les tests API)
  await Seance.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      filmId: film.id,
      salleId: salle.id,
      dateHeureDebut: new Date(Date.now() + 3600000),
      dateHeureFin: new Date(Date.now() + 7200000)
    }
  })
  // Seance avec ID force a 15 (reference en dur dans les tests Cypress)
  const dateDebut = new Date()
  dateDebut.setDate(dateDebut.getDate() + 1)
  const dateFin = new Date(dateDebut.getTime() + 120 * 60000)

  await Seance.findOrCreate({
    where: { id: 15 },
    defaults: {
      id: 15,
      filmId: film.id,
      salleId: salle.id,
      dateHeureDebut: dateDebut,
      dateHeureFin: dateFin
    }
  })

  // Seance additionnelle utilisee par certains tests (id 3725)
  await Seance.findOrCreate({
    where: { id: 3725 },
    defaults: {
      id: 3725,
      filmId: film.id,
      salleId: salle.id,
      dateHeureDebut: dateDebut,
      dateHeureFin: dateFin
    }
  })
// Seance additionnelle utilisee par le parcours réservation e2e complet (id 1576)
  await Seance.findOrCreate({
    where: { id: 1576 },
    defaults: {
      id: 1576,
      filmId: film.id,
      salleId: salle.id,
      dateHeureDebut: dateDebut,
      dateHeureFin: dateFin
    }
  })
  console.log('✅ Donnees de reference seedees (cinema, salle, film, genre,tarf, seances 15 1576 et 3725)')
}
