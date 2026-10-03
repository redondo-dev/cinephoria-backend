// src/controllers/reservation.controller.js

import { Reservation, Seance, Film, Salle, Cinema, Siege, User, Billet, Tarif } from "../models/index.js";
import { sendTicketEmail } from '../utils/sendEmailConfirmation.js';
import MongoReservation from "./mongo/mongo.reservation.model.js";

// --- Controle d'acces : le jeton fournit req.user (id, role_id, role) ---
// Personnel = administrateur (role_id 2) ou employe (role_id 3), cf. middleware d'authentification.
const estPersonnel = (user) =>
  [2, 3].includes(user?.role_id) ||
  ['ADMIN', 'EMPLOYE'].includes(String(user?.role).toUpperCase());

// Une reservation n'est accessible qu'a son proprietaire et au personnel.
const peutAcceder = (user, reservation) =>
  estPersonnel(user) ||
  (reservation.utilisateur_id != null && Number(reservation.utilisateur_id) === Number(user?.id));

export const createReservation = async (req, res) => {
  try {
    const { utilisateur_id: utilisateurDemande = null, seance_id, nb_places, prix_unitaire, date_expiration, sieges, statut_reservation, tarif_id } = req.body;

    // Le proprietaire vient du jeton (authenticate garantit req.user), jamais du corps de la requete :
    // seul le personnel peut creer une reservation au nom d'un client.
    const utilisateur_id = estPersonnel(req.user) ? utilisateurDemande : req.user.id;

    if (!seance_id || !nb_places || !prix_unitaire) {
      return res.status(400).json({
        message: "Champs obligatoires manquants : seance_id, nb_places, prix_unitaire",
      });
    }

    if (prix_unitaire < 0) {
      return res.status(400).json({ message: "Le prix ne peut pas être négatif" });
    }

    if (nb_places <= 0) {
      return res.status(400).json({ message: "Le nombre de places doit être positif" });
    }

    if (!sieges || sieges.length === 0) {
      return res.status(400).json({ message: "Au moins un siège doit être sélectionné" });
    }

    if (sieges.length !== nb_places) {
      return res.status(400).json({
        message: `nb_places (${nb_places}) ne correspond pas au nombre de sièges fournis (${sieges.length})`,
      });
    }

    // ⚠️ Règle Sequelize confirmée empiriquement : dans un tuple [x, alias], x est utilisé
    // TEL QUEL comme colonne SQL brute (jamais traduit via le mapping field: du modèle),
    // que ce soit sur une association incluse ou sur le modèle principal de la requête.
    // Il faut donc le vrai nom de colonne (date_heure_fin), pas le nom d'attribut JS (dateHeureFin).
       const seance = await Seance.findByPk(seance_id, {
      attributes: ['id', ['date_heure_fin', 'date_heure_fin'], 'film_id'],
      include: [{ model: Film, as: 'film', attributes: ['id', 'titre'] }]
    });
    if (!seance) {
      return res.status(404).json({ message: "Séance non trouvée" });
    }

    let resolvedTarifId = tarif_id;
    if (!resolvedTarifId) {
      const tarifParDefaut = await Tarif.findOne({ order: [['id', 'ASC']] });
      if (!tarifParDefaut) {
        return res.status(500).json({ message: "Aucun tarif configuré en base — impossible de créer les billets" });
      }
      resolvedTarifId = tarifParDefaut.id;
    }

    const statutFinal = statut_reservation || 'en_attente';
    const reservation = await Reservation.create({
      utilisateur_id,
      seance_id,
      nb_places,
      prix_unitaire,
      date_expiration: date_expiration || null,
      statut_reservation: statutFinal,
    });

    try {
      await Billet.bulkCreate(
        sieges.map((siege_id) => ({
          reservation_id: reservation.id,
          siege_id,
          seance_id,
          tarif_id: resolvedTarifId,
          statut_billet: statutFinal === 'confirmee' ? 'valide' : 'en_attente',
          prix_final: prix_unitaire,
          date_expiration_qr: seance.dataValues.date_heure_fin,
        }))
      );
    } catch (billetError) {
      await reservation.destroy();
      if (billetError.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: "Un ou plusieurs sièges viennent d'être réservés par quelqu'un d'autre" });
      }
      throw billetError;
    }


    // Ecriture dans MongoDB pour les statistiques du tableau de bord admin.
    // Volontairement isolee dans son propre try/catch : un echec MongoDB ne doit
    // jamais faire echouer la creation de la reservation elle-meme (PostgreSQL).
    if (statutFinal === 'confirmee') {
      try {
        await MongoReservation.create({
          film_id: seance.film_id,
          titre: seance.film?.titre || 'Titre inconnu',
          nb_places,
        });
      } catch (mongoError) {
        console.error('Erreur ecriture MongoDB (statistiques) :', mongoError);
      }
    }
    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    if (!estPersonnel(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const reservations = await Reservation.findAll();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        {
          model: Seance,
          as: "seance",
          include: [
            { model: Film, as: "film", attributes: ["titre"] },
            {
              model: Salle,
              as: "salle",
              attributes: ["nom"],
              include: [{ model: Cinema, as: "cinema", attributes: ["nom"] }],
            },
          ],
        },
        {
          model: Billet,
          as: "billets",
          attributes: ["id", "statut_billet", "qr_code", "prix_final", "siege_id"],
          include: [
            { model: Siege, as: "siege", attributes: ["rangee", "numero_siege"] },
          ],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    if (!peutAcceder(req.user, reservation)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json(reservation);
  } catch (error) {
    console.error("Erreur getReservationById :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    if (!estPersonnel(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Liste blanche : seul le statut est modifiable (cf. Swagger). Le prix, le proprietaire,
    // la seance... ne doivent jamais etre modifies depuis le corps de la requete.
    const { statut_reservation } = req.body ?? {};
    const donnees = statut_reservation !== undefined ? { statut_reservation } : {};
    if (Object.keys(donnees).length === 0) {
      return res.status(400).json({ message: "Aucun champ modifiable fourni (statut_reservation)" });
    }

    const { id } = req.params;
    const [updated] = await Reservation.update(donnees, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    res.json(await Reservation.findByPk(id));
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    if (!estPersonnel(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const deleted = await Reservation.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    res.json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const sendTicketByEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Seance, as: 'seance',
          include: [
            { model: Film, as: 'film', attributes: ['titre'] },
            {
              model: Salle, as: 'salle', attributes: ['nom'],
              include: [{ model: Cinema, as: 'cinema', attributes: ['nom'] }]
            },
          ],
        },
        {
          model: Billet,
          as: 'billets',
          attributes: ['id', 'statut_billet', 'siege_id'],
          include: [
            { model: Siege, as: 'siege', attributes: ['rangee', 'numero_siege'] },
          ],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (!peutAcceder(req.user, reservation)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const user = await User.findByPk(reservation.utilisateur_id, {
      attributes: ['email'],
    });

    if (!user?.email) {
      return res.status(400).json({ message: 'Email utilisateur introuvable' });
    }

    await sendTicketEmail({ to: user.email, reservation });

    res.json({ message: 'Email envoyé avec succès' });
  } catch (err) {
    console.error("Erreur envoi email billet :", err);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email", error: err.message });
  }
};