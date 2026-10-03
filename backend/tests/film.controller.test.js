// tests/film.controller.test.js
// Tests unitaires de la creation et de la modification d'un film (US 8 / US 9).
// Les modeles Sequelize sont simules : aucune base de donnees n'est necessaire.

import { jest } from '@jest/globals';

// --- Mocks ESM : a declarer AVANT l'import dynamique du controleur ---
const mockTransaction = jest.fn();
const mockFilmCreate = jest.fn();
const mockFilmFindByPk = jest.fn();

jest.unstable_mockModule('../src/models/index.js', () => ({
  sequelize: { transaction: mockTransaction },
  Film: { create: mockFilmCreate, findByPk: mockFilmFindByPk },
  Genre: {},
  Seance: {},
}));

let createFilm;
let updateFilm;

beforeAll(async () => {
  ({ createFilm, updateFilm } = await import('../src/controllers/film.controller.js'));
});

// --- Utilitaires ---
const TX = { id: 'transaction-simulee' };

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeFilmInstance = (id = 42) => ({
  id,
  update: jest.fn().mockResolvedValue(undefined),
  setGenres: jest.fn().mockResolvedValue(undefined),
});

const sequelizeError = (name, extra = {}) => Object.assign(new Error(name), { name, ...extra });

beforeEach(() => {
  jest.resetAllMocks();
  // La transaction simulee execute le callback avec un faux objet transaction.
  // Si le callback leve une erreur, elle est propagee : c'est ce qui declenche le rollback reel.
  mockTransaction.mockImplementation(async (callback) => callback(TX));
});

// =====================================================================
// createFilm
// =====================================================================
describe('createFilm', () => {
  const bodyValide = { titre: 'Oppenheimer', duree: 180, genre_id: [1, 2] };

  it.each([
    ['titre manquant', { duree: 180, genre_id: [1] }],
    ['durée manquante', { titre: 'Film', genre_id: [1] }],
    ['genre_id manquant', { titre: 'Film', duree: 180 }],
    ['genre_id = tableau vide', { titre: 'Film', duree: 180, genre_id: [] }],
    ['genre_id contenant une valeur vide', { titre: 'Film', duree: 180, genre_id: [null] }],
  ])('répond 400 et n’écrit rien si %s', async (_cas, body) => {
    const res = mockRes();

    await createFilm({ body }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockFilmCreate).not.toHaveBeenCalled();
  });

  it('crée le film et ses genres dans une transaction (201)', async () => {
    const film = makeFilmInstance(42);
    const filmComplet = { id: 42, titre: 'Oppenheimer', genres: [{ id: 1, nom: 'Drame' }, { id: 2, nom: 'Histoire' }] };
    mockFilmCreate.mockResolvedValue(film);
    mockFilmFindByPk.mockResolvedValue(filmComplet);
    const res = mockRes();

    await createFilm({ body: bodyValide }, res);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockFilmCreate).toHaveBeenCalledWith(
      expect.objectContaining({ titre: 'Oppenheimer', duree: 180 }),
      { transaction: TX }
    );
    expect(film.setGenres).toHaveBeenCalledWith([1, 2], { transaction: TX });
    expect(mockFilmFindByPk).toHaveBeenCalledWith(42, expect.objectContaining({ transaction: TX }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Film créé avec succès', data: filmComplet });
  });

  it('accepte un genre_id simple (valeur seule, pas un tableau)', async () => {
    const film = makeFilmInstance();
    mockFilmCreate.mockResolvedValue(film);
    mockFilmFindByPk.mockResolvedValue({ id: 42 });
    const res = mockRes();

    await createFilm({ body: { titre: 'Film', duree: 100, genre_id: 3 } }, res);

    expect(film.setGenres).toHaveBeenCalledWith([3], { transaction: TX });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('ignore note_moyenne et nombre_avis envoyés par le client (champs calculés)', async () => {
    mockFilmCreate.mockResolvedValue(makeFilmInstance());
    mockFilmFindByPk.mockResolvedValue({ id: 42 });

    await createFilm({ body: { ...bodyValide, note_moyenne: 5, nb_avis: 99, nombre_avis: 99 } }, mockRes());

    const donneesEcrites = mockFilmCreate.mock.calls[0][0];
    expect('note_moyenne' in donneesEcrites).toBe(false);
    expect('nb_avis' in donneesEcrites).toBe(false);
    expect('nombre_avis' in donneesEcrites).toBe(false);
  });

  it('répond 400 (et non 500) si un genre n’existe pas, la transaction est annulée', async () => {
    const film = makeFilmInstance();
    film.setGenres.mockRejectedValue(sequelizeError('SequelizeForeignKeyConstraintError'));
    mockFilmCreate.mockResolvedValue(film);
    const res = mockRes();

    await createFilm({ body: { ...bodyValide, genre_id: [9999] } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Un ou plusieurs genres sont inexistants' });
  });

  it('répond 400 avec les messages de validation Sequelize', async () => {
    mockFilmCreate.mockRejectedValue(
      sequelizeError('SequelizeValidationError', { errors: [{ message: 'Titre invalide' }, { message: 'Durée invalide' }] })
    );
    const res = mockRes();

    await createFilm({ body: bodyValide }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Titre invalide, Durée invalide' });
  });

  it('répond 500 sur une erreur inattendue', async () => {
    mockFilmCreate.mockRejectedValue(new Error('boom'));
    const res = mockRes();

    await createFilm({ body: bodyValide }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Erreur lors de la création du film', error: 'boom' })
    );
  });
});

// =====================================================================
// updateFilm
// =====================================================================
describe('updateFilm', () => {
  const req = (body) => ({ params: { id: '52' }, body });

  it('répond 404 si le film est introuvable', async () => {
    mockFilmFindByPk.mockResolvedValue(null);
    const res = mockRes();

    await updateFilm(req({ titre: 'X' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it.each([
    ['genre_id = tableau vide', []],
    ['genre_id contenant une valeur vide', [null]],
  ])('répond 400 et ne modifie rien si %s', async (_cas, genre_id) => {
    const film = makeFilmInstance(52);
    mockFilmFindByPk.mockResolvedValue(film);
    const res = mockRes();

    await updateFilm(req({ titre: 'Nouveau titre', genre_id }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(film.update).not.toHaveBeenCalled();
    expect(film.setGenres).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('modifie uniquement les champs fournis et conserve les genres (200)', async () => {
    const film = makeFilmInstance(52);
    const filmMisAJour = { id: 52, titre: 'Nouveau titre' };
    mockFilmFindByPk.mockResolvedValueOnce(film).mockResolvedValueOnce(filmMisAJour);
    const res = mockRes();

    await updateFilm(req({ titre: 'Nouveau titre' }), res);

    expect(film.update).toHaveBeenCalledWith({ titre: 'Nouveau titre' }, { transaction: TX });
    expect(film.setGenres).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Film mis à jour avec succès', data: filmMisAJour });
  });

  it('modifie le film et ses genres dans la même transaction (200)', async () => {
    const film = makeFilmInstance(52);
    mockFilmFindByPk.mockResolvedValueOnce(film).mockResolvedValueOnce({ id: 52 });
    const res = mockRes();

    await updateFilm(req({ titre: 'T', genre_id: [3, 4] }), res);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(film.update).toHaveBeenCalledWith({ titre: 'T' }, { transaction: TX });
    expect(film.setGenres).toHaveBeenCalledWith([3, 4], { transaction: TX });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('accepte un genre_id simple (valeur seule, pas un tableau)', async () => {
    const film = makeFilmInstance(52);
    mockFilmFindByPk.mockResolvedValueOnce(film).mockResolvedValueOnce({ id: 52 });

    await updateFilm(req({ genre_id: 5 }), mockRes());

    expect(film.setGenres).toHaveBeenCalledWith([5], { transaction: TX });
  });

  it('ignore note_moyenne, nombre_avis et updatedBy envoyés par le client', async () => {
    const film = makeFilmInstance(52);
    mockFilmFindByPk.mockResolvedValueOnce(film).mockResolvedValueOnce({ id: 52 });

    await updateFilm(
      { params: { id: '52' }, user: { id: 7 }, body: { titre: 'T', note_moyenne: 5, nb_avis: 99, nombre_avis: 99, updatedBy: 7 } },
      mockRes()
    );

    expect(film.update).toHaveBeenCalledWith({ titre: 'T' }, { transaction: TX });
  });

  it('répond 400 (et non 500) si un genre n’existe pas, la transaction est annulée', async () => {
    const film = makeFilmInstance(52);
    film.setGenres.mockRejectedValue(sequelizeError('SequelizeForeignKeyConstraintError'));
    mockFilmFindByPk.mockResolvedValue(film);
    const res = mockRes();

    await updateFilm(req({ genre_id: [9999] }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Un ou plusieurs genres sont inexistants' });
  });

  it('répond 500 sur une erreur inattendue', async () => {
    const film = makeFilmInstance(52);
    film.update.mockRejectedValue(new Error('boom'));
    mockFilmFindByPk.mockResolvedValue(film);
    const res = mockRes();

    await updateFilm(req({ titre: 'T' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Erreur lors de la mise à jour du film', error: 'boom' })
    );
  });
});