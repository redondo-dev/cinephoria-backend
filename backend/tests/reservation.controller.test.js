// // tests/reservation.controller.test.js

// import request from "supertest";
// import { jest } from "@jest/globals";

// // ======================================================
// // MOCK AUTH MIDDLEWARE
// // ======================================================

// await jest.unstable_mockModule("../src/middleware/auth.middleware.js", () => ({
//   authenticate: (req, res, next) => {
//     req.user = {
//       id: 1,
//       role: "CLIENT",
//     };
//     next();
//   },

//   verifyToken: (req, res, next) => {
//     req.user = {
//       id: 1,
//       role: "CLIENT",
//     };
//     next();
//   },

//   requireConfirmedAccount: (req, res, next) => next(),

//   checkMustChangePassword: (req, res, next) => next(),

//   authorizeRoles: () => (req, res, next) => next(),

//   isAdmin: (req, res, next) => next(),

//   isEmploye: (req, res, next) => next(),

//   isClient: (req, res, next) => next(),

//   isVisiteur: (req, res, next) => next(),

//   isAdminOrEmploye: (req, res, next) => next(),
// }));

// // ======================================================
// // MOCK MODELS SEQUELIZE
// // ======================================================

// const Reservation = {
//   create: jest.fn(),

//   findAll: jest.fn(),

//   findByPk: jest.fn(),

//   update: jest.fn(),

//   destroy: jest.fn(),
// };

// // createReservation() appelle aussi Seance.findByPk (pour la date d'expiration
// // du QR code) et Tarif.findOne (tarif par défaut), avant Billet.bulkCreate.
// // Sans ces mocks, le contrôleur répond 404 "Séance non trouvée" avant même
// // d'atteindre Reservation.create — ce qui cassait silencieusement ce test.
// const Billet = {
//   bulkCreate: jest.fn(),
// };

// const Tarif = {
//   findOne: jest.fn(),
// };

// const Seance = {
//   findByPk: jest.fn(),
// };

// await jest.unstable_mockModule("../src/models/index.js", () => ({
//   Reservation,
//   Billet,
//   Tarif,
//   Seance,

//   User: {
//     findByPk: jest.fn(),
//     findOne: jest.fn(),
//   },

//   Role: {},
//   Cinema: {},
//   Film: {},
//   Salle: {},
//   Siege: {},
//   Genre: {},
//   Avis: {},
//   Incident: {},
//   FilmGenre: {},

//   sequelize: {
//     authenticate: jest.fn(),

//     sync: jest.fn(),
//   },
// }));

// // ======================================================
// // MOCK STRIPE
// // ======================================================

// await jest.unstable_mockModule("stripe", () => ({
//   default: jest.fn(() => ({
//     paymentIntents: {
//       create: jest.fn(),

//       retrieve: jest.fn(),
//     },
//   })),
// }));

// // ======================================================
// // IMPORT APP APRES LES MOCKS
// // ======================================================

// const { default: app } = await import("../src/app.js");

// // ======================================================
// // VALEURS PAR DÉFAUT COMMUNES
// // ======================================================

// // Réinitialise et repose des valeurs saines avant chaque test, pour que
// // chaque describe() n'ait pas à répéter la même configuration, et pour
// // éviter qu'un mock configuré dans un test "fuite" vers le suivant.
// beforeEach(() => {
//   jest.clearAllMocks();

//   Seance.findByPk.mockResolvedValue({
//     dataValues: { date_heure_fin: "2026-12-01T22:00:00.000Z" },
//   });

//   Tarif.findOne.mockResolvedValue({ id: 1 });

//   Billet.bulkCreate.mockResolvedValue([]);
// });

// // ======================================================
// // TESTS CRUD RESERVATION
// // ======================================================

// describe("POST /api/reservations", () => {
//   test("Crée une réservation avec succès", async () => {
//     const newReservation = {
//       id: 1,
//       utilisateur_id: null,
//       seance_id: 2,
//       nb_places: 3,
//       prix_unitaire: 10,
//     };

//     Reservation.create.mockResolvedValue(newReservation);

//     const response = await request(app).post("/api/reservations").send({
//       seance_id: 2,
//       nb_places: 3,
//       prix_unitaire: 10,
//       sieges: [10, 11, 12],
//     });

//     expect(response.statusCode).toBe(201);
//     expect(response.body).toEqual(newReservation);
//     expect(Reservation.create).toHaveBeenCalled();
//     expect(Billet.bulkCreate).toHaveBeenCalled();
//   });

//   test("Retourne 400 si champs obligatoires manquants", async () => {
//     const response = await request(app).post("/api/reservations").send({
//       nb_places: 3,
//       sieges: [10, 11, 12],
//     });

//     expect(response.statusCode).toBe(400);
//     expect(response.body.message).toContain("Champs obligatoires");
//   });

//   test("Retourne 500 erreur serveur", async () => {
//     Reservation.create.mockRejectedValue(new Error("Erreur DB"));

//     const response = await request(app).post("/api/reservations").send({
//       seance_id: 2,
//       nb_places: 3,
//       prix_unitaire: 10,
//       sieges: [10, 11, 12],
//     });

//     expect(response.statusCode).toBe(500);
//   });
// });

// describe("GET /api/reservations", () => {
//   test("Retourne toutes les réservations", async () => {
//     const reservations = [
//       {
//         id: 1,
//         seance_id: 2,
//         nb_places: 3,
//         prix_unitaire: 10,
//         sieges: [10, 11, 12],
//       },
//     ];

//     Reservation.findAll.mockResolvedValue(reservations);

//     const response = await request(app).get("/api/reservations");

//     expect(response.statusCode).toBe(200);

//     expect(response.body).toEqual(reservations);

//     expect(Reservation.findAll).toHaveBeenCalled();
//   });

//   test("Erreur serveur", async () => {
//     Reservation.findAll.mockRejectedValue(new Error("Erreur DB"));

//     const response = await request(app).get("/api/reservations");

//     expect(response.statusCode).toBe(500);
//   });
// });

// describe("GET /api/reservations/:id", () => {
//   test("Retourne une réservation", async () => {
//     const reservation = {
//       id: 1,

//       seance_id: 2,
//       nb_places: 3,
//       prix_unitaire: 10,
//       sieges: [10, 11, 12],
//     };

//     Reservation.findByPk.mockResolvedValue(reservation);

//     const response = await request(app).get("/api/reservations/1");

//     expect(response.statusCode).toBe(200);

//     expect(response.body).toEqual(reservation);
//   });

//   test("404 si inexistante", async () => {
//     Reservation.findByPk.mockResolvedValue(null);

//     const response = await request(app).get("/api/reservations/99");

//     expect(response.statusCode).toBe(404);
//   });
// });

// describe("PUT /api/reservations/:id", () => {
//   test("Modification réussie", async () => {
//     Reservation.update.mockResolvedValue([1]);

//     Reservation.findByPk.mockResolvedValue({
//       id: 1,

//       nb_places: 4,
//     });

//     const response = await request(app).put("/api/reservations/1").send({
//       nb_places: 4,
//     });

//     expect(response.statusCode).toBe(200);

//     expect(Reservation.update).toHaveBeenCalled();
//   });
// });

// describe("DELETE /api/reservations/:id", () => {
//   test("Suppression réussie", async () => {
//     Reservation.destroy.mockResolvedValue(1);

//     const response = await request(app).delete("/api/reservations/1");

//     expect(response.statusCode).toBe(200);

//     expect(response.body.message).toContain("supprimée");
//   });

//   test("404 si inexistante", async () => {
//     Reservation.destroy.mockResolvedValue(0);

//     const response = await request(app).delete("/api/reservations/99");
//     expect(response.statusCode).toBe(404);
//   });
// });
// tests/reservation.controller.test.js

import request from "supertest";
import { jest } from "@jest/globals";

// ======================================================
// UTILISATEUR CONNECTE (SIMULE)
// ======================================================

// Utilisateurs tels que les fournit le jeton. Le test choisit qui est connecte
// en changeant `currentUser` ; il est remis à "client" avant chaque test.
const client = { id: 1, role_id: 1, role: "CLIENT" };
const employe = { id: 3, role_id: 3, role: "EMPLOYE" };
const admin = { id: 2, role_id: 2, role: "ADMIN" };

let currentUser = client;

// ======================================================
// MOCK AUTH MIDDLEWARE
// ======================================================

await jest.unstable_mockModule("../src/middleware/auth.middleware.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { ...currentUser };
    next();
  },

  verifyToken: (req, res, next) => {
    req.user = { ...currentUser };
    next();
  },

  requireConfirmedAccount: (req, res, next) => next(),

  checkMustChangePassword: (req, res, next) => next(),

  authorizeRoles: () => (req, res, next) => next(),

  isAdmin: (req, res, next) => next(),

  isEmploye: (req, res, next) => next(),

  isClient: (req, res, next) => next(),

  isVisiteur: (req, res, next) => next(),

  isAdminOrEmploye: (req, res, next) => next(),
}));

// ======================================================
// MOCK MODELS SEQUELIZE
// ======================================================

const Reservation = {
  create: jest.fn(),

  findAll: jest.fn(),

  findByPk: jest.fn(),

  update: jest.fn(),

  destroy: jest.fn(),
};

// createReservation() appelle aussi Seance.findByPk (pour la date d'expiration
// du QR code) et Tarif.findOne (tarif par défaut), avant Billet.bulkCreate.
// Sans ces mocks, le contrôleur répond 404 "Séance non trouvée" avant même
// d'atteindre Reservation.create — ce qui cassait silencieusement ce test.
const Billet = {
  bulkCreate: jest.fn(),
};

const Tarif = {
  findOne: jest.fn(),
};

const Seance = {
  findByPk: jest.fn(),
};

await jest.unstable_mockModule("../src/models/index.js", () => ({
  Reservation,
  Billet,
  Tarif,
  Seance,

  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },

  Role: {},
  Cinema: {},
  Film: {},
  Salle: {},
  Siege: {},
  Genre: {},
  Avis: {},
  Incident: {},
  FilmGenre: {},

  sequelize: {
    authenticate: jest.fn(),

    sync: jest.fn(),
  },
}));

// ======================================================
// MOCK STRIPE
// ======================================================

await jest.unstable_mockModule("stripe", () => ({
  default: jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),

      retrieve: jest.fn(),
    },
  })),
}));

// ======================================================
// IMPORT APP APRES LES MOCKS
// ======================================================

const { default: app } = await import("../src/app.js");

// ======================================================
// VALEURS PAR DÉFAUT COMMUNES
// ======================================================

// Réinitialise et repose des valeurs saines avant chaque test, pour que
// chaque describe() n'ait pas à répéter la même configuration, et pour
// éviter qu'un mock configuré dans un test "fuite" vers le suivant.
beforeEach(() => {
  jest.clearAllMocks();

  currentUser = client;

  Seance.findByPk.mockResolvedValue({
    dataValues: { date_heure_fin: "2026-12-01T22:00:00.000Z" },
  });

  Tarif.findOne.mockResolvedValue({ id: 1 });

  Billet.bulkCreate.mockResolvedValue([]);
});

// ======================================================
// TESTS CRUD RESERVATION
// ======================================================

describe("POST /api/reservations", () => {
  test("Crée une réservation avec succès", async () => {
    const newReservation = {
      id: 1,
      utilisateur_id: 1,
      seance_id: 2,
      nb_places: 3,
      prix_unitaire: 10,
    };

    Reservation.create.mockResolvedValue(newReservation);

    const response = await request(app).post("/api/reservations").send({
      seance_id: 2,
      nb_places: 3,
      prix_unitaire: 10,
      sieges: [10, 11, 12],
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(newReservation);
    expect(Reservation.create).toHaveBeenCalled();
    expect(Billet.bulkCreate).toHaveBeenCalled();
  });

  test("Rattache la réservation à l'utilisateur du jeton, pas à celui du corps", async () => {
    Reservation.create.mockResolvedValue({ id: 1 });

    await request(app).post("/api/reservations").send({
      utilisateur_id: 99,
      seance_id: 2,
      nb_places: 3,
      prix_unitaire: 10,
      sieges: [10, 11, 12],
    });

    expect(Reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ utilisateur_id: 1 }),
    );
  });

  test("Retourne 400 si champs obligatoires manquants", async () => {
    const response = await request(app).post("/api/reservations").send({
      nb_places: 3,
      sieges: [10, 11, 12],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain("Champs obligatoires");
  });

  test("Retourne 500 erreur serveur", async () => {
    Reservation.create.mockRejectedValue(new Error("Erreur DB"));

    const response = await request(app).post("/api/reservations").send({
      seance_id: 2,
      nb_places: 3,
      prix_unitaire: 10,
      sieges: [10, 11, 12],
    });

    expect(response.statusCode).toBe(500);
  });
});

describe("GET /api/reservations", () => {
  test("Retourne toutes les réservations (personnel)", async () => {
    currentUser = admin;

    const reservations = [
      {
        id: 1,
        seance_id: 2,
        nb_places: 3,
        prix_unitaire: 10,
        sieges: [10, 11, 12],
      },
    ];

    Reservation.findAll.mockResolvedValue(reservations);

    const response = await request(app).get("/api/reservations");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual(reservations);

    expect(Reservation.findAll).toHaveBeenCalled();
  });

  test("Refuse la liste complète à un client (403)", async () => {
    const response = await request(app).get("/api/reservations");

    expect(response.statusCode).toBe(403);

    expect(Reservation.findAll).not.toHaveBeenCalled();
  });

  test("Erreur serveur", async () => {
    currentUser = admin;

    Reservation.findAll.mockRejectedValue(new Error("Erreur DB"));

    const response = await request(app).get("/api/reservations");

    expect(response.statusCode).toBe(500);
  });
});

describe("GET /api/reservations/:id", () => {
  test("Retourne sa propre réservation", async () => {
    const reservation = {
      id: 1,
      utilisateur_id: 1,

      seance_id: 2,
      nb_places: 3,
      prix_unitaire: 10,
      sieges: [10, 11, 12],
    };

    Reservation.findByPk.mockResolvedValue(reservation);

    const response = await request(app).get("/api/reservations/1");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual(reservation);
  });

  test("Refuse la réservation d'un autre client (403)", async () => {
    Reservation.findByPk.mockResolvedValue({
      id: 1,
      utilisateur_id: 2,
      seance_id: 2,
    });

    const response = await request(app).get("/api/reservations/1");

    expect(response.statusCode).toBe(403);
  });

  test("Le personnel peut lire la réservation d'un client", async () => {
    currentUser = employe;

    Reservation.findByPk.mockResolvedValue({
      id: 1,
      utilisateur_id: 2,
      seance_id: 2,
    });

    const response = await request(app).get("/api/reservations/1");

    expect(response.statusCode).toBe(200);
  });

  test("404 si inexistante", async () => {
    Reservation.findByPk.mockResolvedValue(null);

    const response = await request(app).get("/api/reservations/99");

    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /api/reservations/:id", () => {
  test("Modification du statut réussie (personnel)", async () => {
    currentUser = employe;

    Reservation.update.mockResolvedValue([1]);

    Reservation.findByPk.mockResolvedValue({
      id: 1,

      statut_reservation: "confirmee",
    });

    const response = await request(app).put("/api/reservations/1").send({
      statut_reservation: "confirmee",
    });

    expect(response.statusCode).toBe(200);

    expect(Reservation.update).toHaveBeenCalledWith(
      { statut_reservation: "confirmee" },
      { where: { id: "1" } },
    );
  });

  test("Refuse la modification à un client (403)", async () => {
    const response = await request(app).put("/api/reservations/1").send({
      statut_reservation: "confirmee",
    });

    expect(response.statusCode).toBe(403);

    expect(Reservation.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/reservations/:id", () => {
  test("Suppression réussie (personnel)", async () => {
    currentUser = admin;

    Reservation.destroy.mockResolvedValue(1);

    const response = await request(app).delete("/api/reservations/1");

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toContain("supprimée");
  });

  test("Refuse la suppression à un client (403)", async () => {
    const response = await request(app).delete("/api/reservations/1");

    expect(response.statusCode).toBe(403);

    expect(Reservation.destroy).not.toHaveBeenCalled();
  });

  test("404 si inexistante", async () => {
    currentUser = admin;

    Reservation.destroy.mockResolvedValue(0);

    const response = await request(app).delete("/api/reservations/99");
    expect(response.statusCode).toBe(404);
  });
});