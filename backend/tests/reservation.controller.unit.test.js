// tests/reservation.controller.unit.test.js
// Tests unitaires COMPLEMENTAIRES du controleur de reservation (US 4) : les fonctions sont appelees
// directement, avec les modeles Sequelize, l'envoi d'email et MongoDB simules. Ils completent
// tests/reservation.controller.test.js (tests d'API via supertest) en couvrant les regles metier
// (validations, tarif, conflit de siege, statistiques MongoDB) ET le controle d'acces :
// un client ne voit, ne modifie et ne supprime pas les reservations des autres.

import { jest } from '@jest/globals';

// --- Mocks ESM : a declarer AVANT l'import dynamique du controleur ---
const Reservation = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};
const Billet = { bulkCreate: jest.fn() };
const Tarif = { findOne: jest.fn() };
const Seance = { findByPk: jest.fn() };
const User = { findByPk: jest.fn() };
const mockSendTicketEmail = jest.fn();
const mockMongoCreate = jest.fn();

jest.unstable_mockModule('../src/models/index.js', () => ({
  Reservation, Seance, Film: {}, Salle: {}, Cinema: {}, Siege: {}, User, Billet, Tarif,
}));
jest.unstable_mockModule('../src/utils/sendEmailConfirmation.js', () => ({
  sendTicketEmail: mockSendTicketEmail,
}));
jest.unstable_mockModule('../src/controllers/mongo/mongo.reservation.model.js', () => ({
  default: { create: mockMongoCreate },
}));

let createReservation;
let getAllReservations;
let getReservationById;
let updateReservation;
let deleteReservation;
let sendTicketByEmail;

beforeAll(async () => {
  ({
    createReservation, getAllReservations, getReservationById,
    updateReservation, deleteReservation, sendTicketByEmail,
  } = await import('../src/controllers/reservation.controller.js'));
});

// --- Utilitaires ---
// Utilisateurs tels que les fournit le jeton (cf. middleware d'authentification)
const client = { id: 7, role_id: 1, role: 'CLIENT' };
const autreClient = { id: 8, role_id: 1, role: 'CLIENT' };
const employe = { id: 3, role_id: 3, role: 'EMPLOYE' };
const admin = { id: 2, role_id: 2, role: 'ADMIN' };

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeSeance = (overrides = {}) => ({
  id: 1,
  film_id: 5,
  film: { titre: 'Oppenheimer' },
  dataValues: { date_heure_fin: '2026-12-01T22:00:00.000Z' },
  ...overrides,
});

const bodyValide = { seance_id: 1, nb_places: 2, prix_unitaire: 9.5, sieges: [10, 11] };

let reservation;
let errorSpy;

beforeEach(() => {
  jest.resetAllMocks();
  // Les erreurs journalisees par le controleur sont attendues : on les masque et on les verifie.
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  reservation = { id: 100, destroy: jest.fn().mockResolvedValue(undefined) };
  Seance.findByPk.mockResolvedValue(makeSeance());
  Tarif.findOne.mockResolvedValue({ id: 1 });
  Reservation.create.mockResolvedValue(reservation);
  Billet.bulkCreate.mockResolvedValue([]);
  mockMongoCreate.mockResolvedValue({});
});

afterEach(() => {
  errorSpy.mockRestore();
});

// =====================================================================
// createReservation
// =====================================================================
describe('createReservation', () => {
  describe('validation (rien ne doit être écrit)', () => {
    it.each([
      ['champs obligatoires manquants', { nb_places: 1, prix_unitaire: 9.5, sieges: [10] },
        'Champs obligatoires manquants : seance_id, nb_places, prix_unitaire'],
      ['prix négatif', { seance_id: 1, nb_places: 1, prix_unitaire: -5, sieges: [10] },
        'Le prix ne peut pas être négatif'],
      ['nombre de places négatif', { seance_id: 1, nb_places: -2, prix_unitaire: 9.5, sieges: [10] },
        'Le nombre de places doit être positif'],
      ['aucun siège fourni', { seance_id: 1, nb_places: 2, prix_unitaire: 9.5 },
        'Au moins un siège doit être sélectionné'],
      ['liste de sièges vide', { seance_id: 1, nb_places: 2, prix_unitaire: 9.5, sieges: [] },
        'Au moins un siège doit être sélectionné'],
      ['nombre de sièges différent du nombre de places', { seance_id: 1, nb_places: 2, prix_unitaire: 9.5, sieges: [10] },
        'nb_places (2) ne correspond pas au nombre de sièges fournis (1)'],
    ])('répond 400 : %s', async (_cas, body, message) => {
      const res = mockRes();

      await createReservation({ body, user: client }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message });
      expect(Seance.findByPk).not.toHaveBeenCalled();
      expect(Reservation.create).not.toHaveBeenCalled();
    });
  });

  it('répond 404 si la séance est introuvable', async () => {
    Seance.findByPk.mockResolvedValue(null);
    const res = mockRes();

    await createReservation({ body: bodyValide, user: client }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Séance non trouvée' });
    expect(Reservation.create).not.toHaveBeenCalled();
  });

  describe('propriétaire de la réservation', () => {
    it('rattache la réservation à l’utilisateur du jeton, pas à celui du corps de la requête', async () => {
      await createReservation({ body: { ...bodyValide, utilisateur_id: 99 }, user: client }, mockRes());

      expect(Reservation.create).toHaveBeenCalledWith(expect.objectContaining({ utilisateur_id: 7 }));
    });

    it('laisse le personnel créer une réservation au nom d’un client', async () => {
      await createReservation({ body: { ...bodyValide, utilisateur_id: 5 }, user: employe }, mockRes());

      expect(Reservation.create).toHaveBeenCalledWith(expect.objectContaining({ utilisateur_id: 5 }));
    });

    it('crée une réservation sans propriétaire si le personnel n’en précise pas', async () => {
      await createReservation({ body: bodyValide, user: admin }, mockRes());

      expect(Reservation.create).toHaveBeenCalledWith(expect.objectContaining({ utilisateur_id: null }));
    });
  });

  describe('tarif', () => {
    it('répond 500 si aucun tarif n’est configuré en base', async () => {
      Tarif.findOne.mockResolvedValue(null);
      const res = mockRes();

      await createReservation({ body: bodyValide, user: client }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Aucun tarif configuré en base — impossible de créer les billets',
      });
      expect(Reservation.create).not.toHaveBeenCalled();
    });

    it('utilise le tarif fourni sans chercher le tarif par défaut', async () => {
      await createReservation({ body: { ...bodyValide, tarif_id: 3 }, user: client }, mockRes());

      expect(Tarif.findOne).not.toHaveBeenCalled();
      const billets = Billet.bulkCreate.mock.calls[0][0];
      expect(billets.map((b) => b.tarif_id)).toEqual([3, 3]);
    });

    it('utilise le tarif par défaut (id le plus bas) quand aucun tarif n’est fourni', async () => {
      Tarif.findOne.mockResolvedValue({ id: 8 });

      await createReservation({ body: bodyValide, user: client }, mockRes());

      const billets = Billet.bulkCreate.mock.calls[0][0];
      expect(billets.map((b) => b.tarif_id)).toEqual([8, 8]);
    });
  });

  describe('réservation en attente (statut par défaut)', () => {
    it('crée la réservation et un billet en attente par siège (201), sans écrire dans MongoDB', async () => {
      const res = mockRes();

      await createReservation({ body: bodyValide, user: client }, res);

      expect(Reservation.create).toHaveBeenCalledWith({
        utilisateur_id: 7,
        seance_id: 1,
        nb_places: 2,
        prix_unitaire: 9.5,
        date_expiration: null,
        statut_reservation: 'en_attente',
      });
      expect(Billet.bulkCreate).toHaveBeenCalledWith([
        { reservation_id: 100, siege_id: 10, seance_id: 1, tarif_id: 1, statut_billet: 'en_attente', prix_final: 9.5, date_expiration_qr: '2026-12-01T22:00:00.000Z' },
        { reservation_id: 100, siege_id: 11, seance_id: 1, tarif_id: 1, statut_billet: 'en_attente', prix_final: 9.5, date_expiration_qr: '2026-12-01T22:00:00.000Z' },
      ]);
      expect(mockMongoCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(reservation);
    });

    it('transmet la date d’expiration quand elle est fournie', async () => {
      await createReservation({
        body: { ...bodyValide, date_expiration: '2026-12-01T10:00:00.000Z' },
        user: client,
      }, mockRes());

      expect(Reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({ date_expiration: '2026-12-01T10:00:00.000Z' })
      );
    });
  });

  describe('réservation confirmée', () => {
    const bodyConfirme = { ...bodyValide, statut_reservation: 'confirmee' };

    it('crée des billets valides et écrit la statistique dans MongoDB (201)', async () => {
      const res = mockRes();

      await createReservation({ body: bodyConfirme, user: client }, res);

      const billets = Billet.bulkCreate.mock.calls[0][0];
      expect(billets.map((b) => b.statut_billet)).toEqual(['valide', 'valide']);
      expect(mockMongoCreate).toHaveBeenCalledWith({ film_id: 5, titre: 'Oppenheimer', nb_places: 2 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('utilise « Titre inconnu » si le titre du film n’est pas disponible', async () => {
      Seance.findByPk.mockResolvedValue(makeSeance({ film: undefined }));

      await createReservation({ body: bodyConfirme, user: client }, mockRes());

      expect(mockMongoCreate).toHaveBeenCalledWith({ film_id: 5, titre: 'Titre inconnu', nb_places: 2 });
    });

    it('répond quand même 201 si MongoDB est en panne (la réservation PostgreSQL reste valide)', async () => {
      mockMongoCreate.mockRejectedValue(new Error('MongoDB indisponible'));
      const res = mockRes();

      await createReservation({ body: bodyConfirme, user: client }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(reservation);
      expect(reservation.destroy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('échec de création des billets', () => {
    it('répond 409 et annule la réservation si un siège vient d’être pris', async () => {
      Billet.bulkCreate.mockRejectedValue(Object.assign(new Error('unique'), { name: 'SequelizeUniqueConstraintError' }));
      const res = mockRes();

      await createReservation({ body: { ...bodyValide, statut_reservation: 'confirmee' }, user: client }, res);

      expect(reservation.destroy).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Un ou plusieurs sièges viennent d\'être réservés par quelqu\'un d\'autre',
      });
      expect(mockMongoCreate).not.toHaveBeenCalled();
    });

    it('annule la réservation puis répond 500 sur toute autre erreur', async () => {
      Billet.bulkCreate.mockRejectedValue(new Error('boom'));
      const res = mockRes();

      await createReservation({ body: bodyValide, user: client }, res);

      expect(reservation.destroy).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur', error: 'boom' });
    });
  });
});

// =====================================================================
// getAllReservations : réservé au personnel
// =====================================================================
describe('getAllReservations', () => {
  it('renvoie la liste complète au personnel', async () => {
    const liste = [{ id: 1 }, { id: 2 }];
    Reservation.findAll.mockResolvedValue(liste);
    const res = mockRes();

    await getAllReservations({ user: employe }, res);

    expect(res.json).toHaveBeenCalledWith(liste);
  });

  it('refuse un client (403) sans lire la base', async () => {
    const res = mockRes();

    await getAllReservations({ user: client }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    expect(Reservation.findAll).not.toHaveBeenCalled();
  });

  it('répond 500 si la lecture échoue', async () => {
    Reservation.findAll.mockRejectedValue(new Error('boom'));
    const res = mockRes();

    await getAllReservations({ user: admin }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur' });
  });
});

// =====================================================================
// getReservationById : propriétaire ou personnel
// =====================================================================
describe('getReservationById', () => {
  const req = (user) => ({ params: { id: '7' }, user });

  it('renvoie sa propre réservation à un client', async () => {
    const trouvee = { id: 7, utilisateur_id: 7 };
    Reservation.findByPk.mockResolvedValue(trouvee);
    const res = mockRes();

    await getReservationById(req(client), res);

    expect(Reservation.findByPk.mock.calls[0][0]).toBe('7');
    expect(res.json).toHaveBeenCalledWith(trouvee);
  });

  it('renvoie la réservation d’un client au personnel', async () => {
    const trouvee = { id: 7, utilisateur_id: 7 };
    Reservation.findByPk.mockResolvedValue(trouvee);
    const res = mockRes();

    await getReservationById(req(employe), res);

    expect(res.json).toHaveBeenCalledWith(trouvee);
  });

  it('refuse (403) la réservation d’un autre client', async () => {
    Reservation.findByPk.mockResolvedValue({ id: 7, utilisateur_id: 7 });
    const res = mockRes();

    await getReservationById(req(autreClient), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
  });

  it.each([
    ['un client', client],
    ['un utilisateur sans identifiant', { id: null, role_id: 1, role: 'CLIENT' }],
  ])('refuse (403) à %s une réservation sans propriétaire', async (_cas, demandeur) => {
    Reservation.findByPk.mockResolvedValue({ id: 7, utilisateur_id: null });
    const res = mockRes();

    await getReservationById(req(demandeur), res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('répond 404 si la réservation est introuvable', async () => {
    Reservation.findByPk.mockResolvedValue(null);
    const res = mockRes();

    await getReservationById(req(client), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Réservation non trouvée' });
  });

  it('répond 500 si la lecture échoue', async () => {
    Reservation.findByPk.mockRejectedValue(new Error('boom'));
    const res = mockRes();

    await getReservationById(req(client), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur', error: 'boom' });
    expect(errorSpy).toHaveBeenCalled();
  });
});

// =====================================================================
// updateReservation : réservé au personnel, seul le statut est modifiable
// =====================================================================
describe('updateReservation', () => {
  it('refuse un client (403) : il ne peut pas se confirmer lui-même une réservation', async () => {
    const res = mockRes();

    await updateReservation({ params: { id: '7' }, body: { statut_reservation: 'confirmee' }, user: client }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    expect(Reservation.update).not.toHaveBeenCalled();
  });

  it('modifie uniquement le statut, même si le corps contient d’autres champs', async () => {
    const misAJour = { id: 7, statut_reservation: 'confirmee' };
    Reservation.update.mockResolvedValue([1]);
    Reservation.findByPk.mockResolvedValue(misAJour);
    const res = mockRes();

    await updateReservation({
      params: { id: '7' },
      body: { statut_reservation: 'confirmee', prix_unitaire: 0.01, utilisateur_id: 99, nb_places: 50 },
      user: employe,
    }, res);

    expect(Reservation.update).toHaveBeenCalledWith({ statut_reservation: 'confirmee' }, { where: { id: '7' } });
    expect(res.json).toHaveBeenCalledWith(misAJour);
  });

  it('reconnaît le personnel par le nom du rôle', async () => {
    Reservation.update.mockResolvedValue([1]);
    Reservation.findByPk.mockResolvedValue({ id: 7 });
    const res = mockRes();

    await updateReservation({ params: { id: '7' }, body: { statut_reservation: 'annulee' }, user: { id: 2, role: 'admin' } }, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(Reservation.update).toHaveBeenCalled();
  });

  it.each([
    ['aucun champ modifiable dans le corps', { prix_unitaire: 1 }],
    ['corps absent', undefined],
  ])('répond 400 si %s', async (_cas, body) => {
    const res = mockRes();

    await updateReservation({ params: { id: '7' }, body, user: employe }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Aucun champ modifiable fourni (statut_reservation)' });
    expect(Reservation.update).not.toHaveBeenCalled();
  });

  it('répond 404 si aucune réservation n’est modifiée', async () => {
    Reservation.update.mockResolvedValue([0]);
    const res = mockRes();

    await updateReservation({ params: { id: '7' }, body: { statut_reservation: 'confirmee' }, user: employe }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Réservation non trouvée' });
  });

  it('répond 500 si la modification échoue', async () => {
    Reservation.update.mockRejectedValue(new Error('boom'));
    const res = mockRes();

    await updateReservation({ params: { id: '7' }, body: { statut_reservation: 'confirmee' }, user: employe }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur' });
  });
});

// =====================================================================
// deleteReservation : réservé au personnel
// =====================================================================
describe('deleteReservation', () => {
  it('refuse un client (403) sans rien supprimer', async () => {
    const res = mockRes();

    await deleteReservation({ params: { id: '7' }, user: client }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    expect(Reservation.destroy).not.toHaveBeenCalled();
  });

  it('supprime la réservation pour le personnel', async () => {
    Reservation.destroy.mockResolvedValue(1);
    const res = mockRes();

    await deleteReservation({ params: { id: '7' }, user: admin }, res);

    expect(Reservation.destroy).toHaveBeenCalledWith({ where: { id: '7' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Réservation supprimée avec succès' });
  });

  it('répond 404 si la réservation n’existe pas', async () => {
    Reservation.destroy.mockResolvedValue(0);
    const res = mockRes();

    await deleteReservation({ params: { id: '7' }, user: admin }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Réservation non trouvée' });
  });

  it('répond 500 si la suppression échoue', async () => {
    Reservation.destroy.mockRejectedValue(new Error('boom'));
    const res = mockRes();

    await deleteReservation({ params: { id: '7' }, user: admin }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur' });
  });
});

// =====================================================================
// sendTicketByEmail : propriétaire ou personnel
// =====================================================================
describe('sendTicketByEmail', () => {
  const req = (user) => ({ params: { id: '7' }, user });

  it('répond 404 si la réservation est introuvable', async () => {
    Reservation.findByPk.mockResolvedValue(null);
    const res = mockRes();

    await sendTicketByEmail(req(client), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Réservation non trouvée' });
    expect(mockSendTicketEmail).not.toHaveBeenCalled();
  });

  it('refuse (403) l’envoi du billet d’un autre client', async () => {
    Reservation.findByPk.mockResolvedValue({ id: 7, utilisateur_id: 7 });
    const res = mockRes();

    await sendTicketByEmail(req(autreClient), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès refusé' });
    expect(User.findByPk).not.toHaveBeenCalled();
    expect(mockSendTicketEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['utilisateur introuvable', null],
    ['utilisateur sans adresse email', { email: null }],
  ])('répond 400 si %s', async (_cas, utilisateur) => {
    Reservation.findByPk.mockResolvedValue({ id: 7, utilisateur_id: 7 });
    User.findByPk.mockResolvedValue(utilisateur);
    const res = mockRes();

    await sendTicketByEmail(req(client), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email utilisateur introuvable' });
    expect(mockSendTicketEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['au propriétaire', client],
    ['au personnel', employe],
  ])('envoie le billet à l’adresse de l’utilisateur, %s', async (_cas, demandeur) => {
    const trouvee = { id: 7, utilisateur_id: 7 };
    Reservation.findByPk.mockResolvedValue(trouvee);
    User.findByPk.mockResolvedValue({ email: 'client@exemple.fr' });
    mockSendTicketEmail.mockResolvedValue(undefined);
    const res = mockRes();

    await sendTicketByEmail(req(demandeur), res);

    expect(User.findByPk.mock.calls[0][0]).toBe(7);
    expect(mockSendTicketEmail).toHaveBeenCalledWith({ to: 'client@exemple.fr', reservation: trouvee });
    expect(res.json).toHaveBeenCalledWith({ message: 'Email envoyé avec succès' });
  });

  it('répond 500 si l’envoi échoue', async () => {
    Reservation.findByPk.mockResolvedValue({ id: 7, utilisateur_id: 7 });
    User.findByPk.mockResolvedValue({ email: 'client@exemple.fr' });
    mockSendTicketEmail.mockRejectedValue(new Error('SMTP indisponible'));
    const res = mockRes();

    await sendTicketByEmail(req(client), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Erreur lors de l\'envoi de l\'email',
      error: 'SMTP indisponible',
    });
    expect(errorSpy).toHaveBeenCalled();
  });
});