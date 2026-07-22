// tests/reservations/reservation.controller.test.js
import request from "supertest";
import { jest } from "@jest/globals";

// Mock du modèle Reservation
await jest.unstable_mockModule("../../src/models/reservation.model.js", () => ({
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Mock de src/models/index.js pour éviter les erreurs d'associations
await jest.unstable_mockModule("../../src/models/index.js", () => ({
  Reservation: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Seance: {},
  Film: {},
  Salle: {},
  Cinema: {},
  Genre: {},
}));

// Imports après les mocks
const { default: app } = await import("../../src/app.js");
const { default: Reservation } = await import("../../src/models/reservation.model.js");

describe("Tests API Reservations CRUD", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------
  // POST /api/reservations
  // -------------------------
  describe("POST /api/reservations", () => {
    it("Crée une réservation avec succès", async () => {
      const newReservation = {
        id: 1,
        utilisateur_id: null,
        seance_id: 2,
        nb_places: 3,
        prix_unitaire: 10,
      };

      Reservation.create.mockResolvedValue(newReservation);

      const res = await request(app).post("/api/reservations").send({
        seance_id: 2,
        nb_places: 3,
        prix_unitaire: 10,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(newReservation);
      expect(Reservation.create).toHaveBeenCalledWith({
        utilisateur_id: null,
        seance_id: 2,
        nb_places: 3,
        prix_unitaire: 10,
        date_expiration: null,
      });
    });

    it("Échoue si des champs obligatoires manquent", async () => {
      const res = await request(app).post("/api/reservations").send({
        utilisateur_id: 1,
        // seance_id manquant
        nb_places: 3,
        prix_unitaire: 10,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Champs obligatoires manquants : seance_id, nb_places, prix_unitaire");
    });

    it("Gère les erreurs serveur", async () => {
      Reservation.create.mockRejectedValue(new Error("Erreur DB"));

      const res = await request(app).post("/api/reservations").send({
        seance_id: 2,
        nb_places: 3,
        prix_unitaire: 10,
      });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  // -------------------------
  // GET /api/reservations
  // -------------------------
  describe("GET /api/reservations", () => {
    it("Récupère toutes les réservations", async () => {
      const reservations = [
        { id: 1, seance_id: 2, nb_places: 3 },
        { id: 2, seance_id: 3, nb_places: 2 }
      ];

      Reservation.findAll.mockResolvedValue(reservations);

      const res = await request(app).get("/api/reservations");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(reservations);
      expect(Reservation.findAll).toHaveBeenCalled();
    });

    it("Gère les erreurs serveur", async () => {
      Reservation.findAll.mockRejectedValue(new Error("Erreur DB"));

      const res = await request(app).get("/api/reservations");

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  // -------------------------
  // GET /api/reservations/:id
  // -------------------------
  describe("GET /api/reservations/:id", () => {
    it("Récupère une réservation par ID", async () => {
      const reservation = { 
        id: 1, 
        seance_id: 2, 
        nb_places: 3,
        prix_unitaire: 10
      };

      Reservation.findByPk.mockResolvedValue(reservation);

      const res = await request(app).get("/api/reservations/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(reservation);
      expect(Reservation.findByPk).toHaveBeenCalledWith("1");
    });

    it("Retourne 404 si réservation non trouvée", async () => {
      Reservation.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/api/reservations/99");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Réservation non trouvée");
    });

    it("Gère les erreurs serveur", async () => {
      Reservation.findByPk.mockRejectedValue(new Error("Erreur DB"));

      const res = await request(app).get("/api/reservations/1");

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  // -------------------------
  // PUT /api/reservations/:id
  // -------------------------
  describe("PUT /api/reservations/:id", () => {
    it("Met à jour une réservation avec succès", async () => {
      const updatedReservation = { 
        id: 1, 
        seance_id: 2, 
        nb_places: 4,
        prix_unitaire: 10
      };

      Reservation.update.mockResolvedValue([1]); // [nb de lignes affectées]
      Reservation.findByPk.mockResolvedValue(updatedReservation);

      const res = await request(app)
        .put("/api/reservations/1")
        .send({ nb_places: 4 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updatedReservation);
      expect(Reservation.update).toHaveBeenCalledWith(
        { nb_places: 4 }, 
        { where: { id: "1" } }
      );
    });

    it("Retourne 404 si réservation non trouvée", async () => {
      Reservation.update.mockResolvedValue([0]); // Aucune ligne affectée

      const res = await request(app)
        .put("/api/reservations/99")
        .send({ nb_places: 4 });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Réservation non trouvée");
    });

    it("Gère les erreurs serveur", async () => {
      Reservation.update.mockRejectedValue(new Error("Erreur DB"));

      const res = await request(app)
        .put("/api/reservations/1")
        .send({ nb_places: 4 });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  // -------------------------
  // DELETE /api/reservations/:id
  // -------------------------
  describe("DELETE /api/reservations/:id", () => {
    it("Supprime une réservation avec succès", async () => {
      Reservation.destroy.mockResolvedValue(1); // 1 ligne supprimée

      const res = await request(app).delete("/api/reservations/1");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Réservation supprimée avec succès");
      expect(Reservation.destroy).toHaveBeenCalledWith({
        where: { id: "1" }
      });
    });

    it("Retourne 404 si réservation non trouvée", async () => {
      Reservation.destroy.mockResolvedValue(0); // Aucune ligne supprimée

      const res = await request(app).delete("/api/reservations/99");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Réservation non trouvée");
    });

    it("Gère les erreurs serveur", async () => {
      Reservation.destroy.mockRejectedValue(new Error("Erreur DB"));

      const res = await request(app).delete("/api/reservations/1");

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });
});