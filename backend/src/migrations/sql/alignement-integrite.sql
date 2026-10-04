-- =====================================================================
-- alignement-integrite.sql
-- Aligne la base sur le schema attendu : integrite des billets et
-- cles etrangeres manquantes. Executable sans risque sur toute base :
-- chaque etape est ignoree si son resultat existe deja.
--
-- Execute par la migration 20261004100000-alignement-integrite.cjs.
-- Un envoi multi-instructions est une seule transaction : si une etape
-- echoue, rien n'est applique.
--
-- Essai a blanc (rien n'est modifie) :
--   (echo "BEGIN;"; cat alignement-integrite.sql; echo "ROLLBACK;") | psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d cinephoria
-- =====================================================================

-- 1. Ancienne contrainte du schema initial : unique (siege_id, seance_id) sans
--    condition. Elle empeche de reserver a nouveau un siege dont le billet est
--    annule. La migration fix-billet-table cree l'index partiel ci-dessous mais
--    ne la supprime pas.
ALTER TABLE public.billet DROP CONSTRAINT IF EXISTS unique_siege_par_seance;

-- 2. Index unique partiel : un siege n'a qu'un billet actif (non annule) par seance.
--    Si des doublons actifs existent deja, l'etape s'arrete avec un message clair
--    au lieu de supprimer des donnees.
DO $$
DECLARE
    doublons integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'unique_siege_actif_par_seance'
    ) THEN
        SELECT COUNT(*) INTO doublons
        FROM (
            SELECT siege_id, seance_id
            FROM public.billet
            WHERE statut_billet <> 'annule' AND seance_id IS NOT NULL
            GROUP BY siege_id, seance_id
            HAVING COUNT(*) > 1
        ) AS d;

        IF doublons > 0 THEN
            RAISE EXCEPTION 'Migration interrompue : % couple(s) siege/seance portent plusieurs billets actifs. Annuler ces doublons avant de creer unique_siege_actif_par_seance.', doublons;
        END IF;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_siege_actif_par_seance
    ON public.billet (siege_id, seance_id)
    WHERE statut_billet <> 'annule';

-- 3. Cles etrangeres manquantes, en mode NOT VALID : elles s'appliquent aux
--    nouvelles ecritures sans verifier les lignes existantes (les orphelins
--    deja presents ne bloquent donc pas la migration).

-- siege -> salle : supprimer une salle supprime ses sieges, sauf si un billet
-- existe sur l'un d'eux (billet.siege_id est en ON DELETE RESTRICT).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.siege'::regclass
          AND confrelid = 'public.salle'::regclass
    ) THEN
        ALTER TABLE public.siege
            ADD CONSTRAINT fk_siege_salle FOREIGN KEY (salle_id)
            REFERENCES public.salle (id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
    END IF;
END $$;

-- seance -> film : un film qui a des seances ne peut pas etre supprime.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.seance'::regclass
          AND confrelid = 'public.film'::regclass
    ) THEN
        ALTER TABLE public.seance
            ADD CONSTRAINT fk_seance_film FOREIGN KEY (film_id)
            REFERENCES public.film (id) ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
    END IF;
END $$;

-- film_genre -> film : supprimer un film supprime ses liaisons de genre.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.film_genre'::regclass
          AND confrelid = 'public.film'::regclass
    ) THEN
        ALTER TABLE public.film_genre
            ADD CONSTRAINT fk_film_genre_film FOREIGN KEY (film_id)
            REFERENCES public.film (id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
    END IF;
END $$;

-- film_genre -> genre : un genre utilise par un film ne peut pas etre supprime
-- (un film doit toujours garder au moins un genre).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.film_genre'::regclass
          AND confrelid = 'public.genre'::regclass
    ) THEN
        ALTER TABLE public.film_genre
            ADD CONSTRAINT fk_film_genre_genre FOREIGN KEY (genre_id)
            REFERENCES public.genre (id) ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
    END IF;
END $$;

-- avis -> film : supprimer un film supprime ses avis.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.avis'::regclass
          AND confrelid = 'public.film'::regclass
    ) THEN
        ALTER TABLE public.avis
            ADD CONSTRAINT fk_avis_film FOREIGN KEY (film_id)
            REFERENCES public.film (id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
    END IF;
END $$;
