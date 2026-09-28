-- =====================================================================
-- donnees-reference.sql
-- Données de référence de Cinéphoria : rôles, genres, cinémas, tarifs.
--
-- Exécution (base de développement) :
--   PGCLIENTENCODING=UTF8 psql -h localhost -U postgres -d cinephoria -f donnees-reference.sql
--
-- Rejouable : les rôles, genres et tarifs déjà présents sont conservés
-- (ON CONFLICT DO NOTHING). Les 7 cinémas sont, eux, remis à jour
-- (ON CONFLICT (id) DO UPDATE) : le fichier fait foi pour leurs coordonnées.
-- =====================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- Rôles de l'application ----------------------------------------------
INSERT INTO role (id, nom_role) VALUES
    (1, 'client'),
    (2, 'admin'),
    (3, 'employe'),
    (4, 'visiteur')
ON CONFLICT DO NOTHING;

-- Genres --------------------------------------------------------------
INSERT INTO genre (id, nom, description) VALUES
    (1,  'Science-fiction', 'Films d''anticipation, de technologie et d''univers futuristes.'),
    (2,  'Horreur',         'Films d''horreur et épouvante'),
    (3,  'Documentaire',    'Films documentaires'),
    (4,  'Animation',       'Films d''animation'),
    (5,  'Action',          'Films avec beaucoup de scènes physiques, combats et poursuites.'),
    (6,  'Aventure',        'Films racontant des voyages épiques ou des quêtes.'),
    (7,  'Drame',           'Films axés sur les émotions, les conflits et la psychologie des personnages.'),
    (8,  'Romance',         'Films centrés sur des histoires d''amour et de relations sentimentales.'),
    (9,  'Thriller',        'Films créant suspense, tension et intrigue.'),
    (10, 'Fantastique',     'Films avec éléments surnaturels, magie ou mondes imaginaires.'),
    (11, 'Comédie',         'Films conçus pour faire rire et divertir.')
ON CONFLICT DO NOTHING;

-- Cinémas : les 7 salles du cahier des charges ------------------------
-- 5 en France (Paris, Bordeaux, Lille, Nantes, Toulouse)
-- et 2 en Belgique (Charleroi, Liège).
-- Les adresses, codes postaux et téléphones sont fictifs : à remplacer
-- par les vraies coordonnées si elles existent.
INSERT INTO cinema (id, nom, ville, adresse, code_postal, telephone, pays, horaire) VALUES
    (1, 'Cinéma Paris',     'Paris',     '123 Rue Exemple',      '75001', '0123456789', 'France',   '10:00-23:00'),
    (2, 'Cinéma Bordeaux',  'Bordeaux',  '34 Rue de Bordeaux',   '33000', '0202020202', 'France',   '10:00-23:00'),
    (3, 'Cinéma Lille',     'Lille',     '56 Rue de Lille',      '59000', '0303030303', 'France',   '10:00-23:00'),
    (4, 'Cinéma Nantes',    'Nantes',    '78 Rue de Nantes',     '44000', '0404040404', 'France',   '10:00-23:00'),
    (5, 'Cinéma Charleroi', 'Charleroi', '90 Rue de Charleroi',  '6000',  '0505050505', 'Belgique', '10:00-23:00'),
    (6, 'Cinéma Liège',     'Liège',     '12 Rue de Liège',      '4000',  '0606060606', 'Belgique', '10:00-23:00'),
    (7, 'Cinéma Toulouse',  'Toulouse',  '21 Rue de Toulouse',   '31000', '0707070707', 'France',   '10:00-23:00')
ON CONFLICT (id) DO UPDATE SET
    nom         = EXCLUDED.nom,
    ville       = EXCLUDED.ville,
    adresse     = EXCLUDED.adresse,
    code_postal = EXCLUDED.code_postal,
    telephone   = EXCLUDED.telephone,
    pays        = EXCLUDED.pays,
    horaire     = EXCLUDED.horaire;

-- Tarifs de base ------------------------------------------------------
-- type_tarif doit valoir 'normal' ou 'reduit' (contrainte check-type_tarif).
INSERT INTO tarif (id, nom_tarif, type_tarif, prix_unitaire, description) VALUES
    (1, 'Normal',   'normal', 9.50, 'Tarif standard adulte'),
    (2, 'Étudiant', 'reduit', 7.00, 'Tarif réduit étudiant'),
    (3, 'Enfant',   'reduit', 5.50, 'Moins de 12 ans')
ON CONFLICT DO NOTHING;

-- Compteurs d'identifiants ---------------------------------------------
-- Les lignes ci-dessus ont des identifiants explicites : sans cette étape,
-- le prochain INSERT automatique pourrait réutiliser un identifiant existant
-- (erreur « clé dupliquée », déjà rencontrée sur la table cinema).
SELECT setval('role_id_role_seq',   (SELECT MAX(id) FROM role));
SELECT setval('genre_id_seq',       (SELECT MAX(id) FROM genre));
SELECT setval('cinema_id_seq',      (SELECT MAX(id) FROM cinema));
SELECT setval('tarif_id_tarif_seq', (SELECT MAX(id) FROM tarif));

COMMIT;

-- Vérification --------------------------------------------------------
SELECT 'role'   AS table_verifiee, COUNT(*) AS lignes FROM role
UNION ALL SELECT 'genre',  COUNT(*) FROM genre
UNION ALL SELECT 'cinema', COUNT(*) FROM cinema
UNION ALL SELECT 'tarif',  COUNT(*) FROM tarif;