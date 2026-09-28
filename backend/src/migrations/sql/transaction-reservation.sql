-- =====================================================================
-- transaction-reservation.sql
-- Transaction SQL : création d'une réservation et de ses billets.
--
-- But : une réservation n'a de sens qu'avec ses billets. Les deux
-- INSERT doivent réussir ensemble, ou ne rien laisser en base
-- (atomicité : « tout est effectué, ou rien »).
--
-- À exécuter sur une base de développement (ex. : cinephoria), par exemple :
--   psql -h localhost -U postgres -d cinephoria -f transaction-reservation.sql
-- Identifiants utilisés (à adapter) : utilisateur 153, séance 3725.
-- =====================================================================

SET client_encoding = 'UTF8';

-- ---------------------------------------------------------------------
-- PARTIE A : réservation de 2 places, cas nominal (COMMIT)
-- ---------------------------------------------------------------------
BEGIN;

-- Étape 1 : la réservation.
INSERT INTO reservation
    (utilisateur_id, seance_id, nb_places, prix_unitaire, statut_reservation, date_creation)
VALUES
    (153, 3725, 2, 9.50, 'confirmee', NOW())
RETURNING id AS reservation_creee;

-- Étape 2 : un billet par siège, choisi parmi les sièges libres de la salle
-- de la séance (un siège est occupé s'il porte un billet non annulé pour
-- cette séance). currval() reprend l'identifiant de l'étape 1.
INSERT INTO billet
    (reservation_id, seance_id, siege_id, tarif_id, statut_billet, prix_final, date_expiration_qr)
SELECT
    currval('reservation_id_seq'),
    se.id,
    sg.id,
    (SELECT MIN(id) FROM tarif),
    'valide',
    9.50,
    se.date_heure_fin
FROM seance se
JOIN siege sg ON sg.salle_id = se.salle_id
WHERE se.id = 3725
  AND sg.id NOT IN (
        SELECT b.siege_id
        FROM billet b
        JOIN reservation r ON r.id = b.reservation_id
        WHERE r.seance_id = 3725
          AND b.statut_billet <> 'annule')
ORDER BY sg.id
LIMIT 2;

-- Étape 3 : contrôle. S'il n'y a pas assez de sièges libres, l'INSERT
-- ci-dessus a créé moins de billets que de places demandées : l'exception
-- annule alors toute la transaction, réservation comprise.
DO $$
DECLARE
    attendu integer;
    obtenu  integer;
BEGIN
    SELECT nb_places INTO attendu FROM reservation WHERE id = currval('reservation_id_seq');
    SELECT COUNT(*)  INTO obtenu  FROM billet      WHERE reservation_id = currval('reservation_id_seq');
    IF obtenu <> attendu THEN
        RAISE EXCEPTION 'Sièges insuffisants : % billet(s) créé(s) pour % place(s) demandée(s)', obtenu, attendu;
    END IF;
END $$;

COMMIT;
-- Si une erreur a interrompu la partie A, PostgreSQL refuse la suite de la
-- transaction : le COMMIT ci-dessus est alors traité comme un ROLLBACK.
-- (Dans un client graphique, exécuter ROLLBACK; à la main.)

-- Vérification : la réservation et ses 2 billets existent.
SELECT r.id AS reservation, COUNT(b.id) AS billets
FROM reservation r
JOIN billet b ON b.reservation_id = r.id
WHERE r.id = currval('reservation_id_seq')
GROUP BY r.id;

-- Nettoyage facultatif : supprimer la réservation supprime aussi ses billets
-- (clé étrangère fk_billet_reservation en ON DELETE CASCADE).
-- DELETE FROM reservation WHERE id = currval('reservation_id_seq');


-- ---------------------------------------------------------------------
-- PARTIE B : échec au milieu de la transaction (ROLLBACK)
-- Le billet référence un siège qui n'existe pas : la clé étrangère
-- fk_siege_id refuse l'INSERT. L'erreur affichée est attendue.
-- ---------------------------------------------------------------------
SELECT COUNT(*) AS reservations_avant FROM reservation;

BEGIN;

INSERT INTO reservation
    (utilisateur_id, seance_id, nb_places, prix_unitaire, statut_reservation, date_creation)
VALUES
    (153, 3725, 1, 9.50, 'confirmee', NOW());

-- Échoue : siège 999999999 inexistant (violation de fk_siege_id).
INSERT INTO billet
    (reservation_id, seance_id, siege_id, tarif_id, statut_billet, prix_final)
VALUES
    (currval('reservation_id_seq'), 3725, 999999999, (SELECT MIN(id) FROM tarif), 'valide', 9.50);

ROLLBACK;

-- Le nombre de réservations est inchangé : la réservation de l'étape 1
-- a été annulée avec le reste. (Seul le compteur de la séquence a avancé :
-- une séquence n'est jamais rétablie par un ROLLBACK, d'où d'éventuels
-- « trous » dans les identifiants.)
SELECT COUNT(*) AS reservations_apres FROM reservation;