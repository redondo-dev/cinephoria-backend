-- PostgreSQL database dump
-- Dumped from database version 17.10 (Debian 17.10-1.pgdg12+1)
-- Dumped by pg_dump version 17.5
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
-- *not* creating schema, since initdb creates it
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
COMMENT ON SCHEMA public IS '';
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';
-- Name: enum_Users_role; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public."enum_Users_role" AS ENUM (
    'visitor',
    'user',
    'admin',
    'utilisateur',
    'employe',
    'visiteur',
    'employee'
);
-- Name: enum_avis_statut_avis; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.enum_avis_statut_avis AS ENUM (
    'en_attente',
    'valide',
    'rejete'
);
-- Name: enum_reservation_statut_reservation; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.enum_reservation_statut_reservation AS ENUM (
    'en_attente',
    'confirmee',
    'annulee',
    'valide'
);
-- Name: enum_salle_qualite_pprojection; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.enum_salle_qualite_pprojection AS ENUM (
    'Standard',
    'IMAX',
    '2D',
    '3D',
    '4DX',
    'Dolby Atmos',
    'ScreenX'
);
-- Name: enum_salle_qualite_projection; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.enum_salle_qualite_projection AS ENUM (
    'Standard',
    'IMAX',
    '4DX',
    '2D',
    '3D',
    'Dolby Atmos',
    'ScreenX'
);
-- Name: enum_utilisateur_role; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.enum_utilisateur_role AS ENUM (
    'visitor',
    'user',
    'admin',
    'employee'
);
-- Name: etat_siege_enum; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.etat_siege_enum AS ENUM (
    'Libre',
    'Occupé',
    'Cassé'
);
-- Name: statut_siege_enum; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.statut_siege_enum AS ENUM (
    'Disponible',
    'Réservé',
    'Vendu',
    'Annulé'
);
-- Name: type_siege_enum; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.type_siege_enum AS ENUM (
    'classique',
    'premium',
    'vip',
    'pmr',
    'couple'
);
-- Name: verifier_capacite_salle(); Type: FUNCTION; Schema: public; Owner: -
CREATE FUNCTION public.verifier_capacite_salle() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    capacite_max INTEGER;
    places_deja_reservees INTEGER;
    places_disponibles INTEGER;
    nom_salle VARCHAR(100);
    titre_film VARCHAR(255);
    date_seance TIMESTAMP;
BEGIN
    -- Récupérer les informations de la séance et de la salle
    SELECT 
        sa.capacite, 
        sa.nom_salle, 
        f.titre, 
        s.date_heure
    INTO capacite_max, nom_salle, titre_film, date_seance
    FROM seance s
    JOIN salle sa ON s.salle_id = sa.salle_id
    JOIN film f ON s.film_id = f.film_id
    WHERE s.seance_id = NEW.seance_id;
    
    -- Calculer les places déjà réservées (en excluant la réservation actuelle si c'est un UPDATE)
    SELECT COALESCE(SUM(r.nbplaces), 0)
    INTO places_deja_reservees
    FROM reservation r
    WHERE r.seance_id = NEW.seance_id 
        AND r.statut NOT IN ('annulee', 'remboursee')
        AND (TG_OP = 'INSERT' OR r.reservation_id != NEW.reservation_id);
    
    -- Calculer les places disponibles
    places_disponibles := capacite_max - places_deja_reservees;
    
    -- Vérification 1 : Une seule réservation dépasse la capacité totale
    IF NEW.nbplaces > capacite_max THEN
        RAISE EXCEPTION 'RÉSERVATION REFUSÉE: % places demandées mais la salle "%" n''a que % places au total. Film: "%" le %', 
            NEW.nbplaces, nom_salle, capacite_max, titre_film, date_seance;
    END IF;
    
    -- Vérification 2 : Cette réservation + les existantes dépassent la capacité
    IF NEW.nbplaces > places_disponibles THEN
        RAISE EXCEPTION 'RÉSERVATION REFUSÉE: % places demandées mais seulement % places disponibles. Salle "%": %/% places déjà réservées. Film: "%" le %', 
            NEW.nb_places, places_disponibles, nom_salle, places_deja_reservees, capacite_max, titre_film, date_seance;
    END IF;
    
    -- Si tout va bien, permettre la réservation
    RETURN NEW;
END;
$$;
-- Name: verifier_coherence_reservation(); Type: PROCEDURE; Schema: public; Owner: -
CREATE PROCEDURE public.verifier_coherence_reservation()
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT 
      s.id AS seance_id,
      sa.nom_salle,
      sa.capacite,
      COUNT(DISTINCT rs.siege_id) AS places_reservees
    FROM seance s
    JOIN salle sa ON s.salle_id = sa.id
    LEFT JOIN reservation r ON r.seance_id = s.id
    LEFT JOIN reservation_siege rs ON rs.reservation_id = r.id
    GROUP BY s.id, sa.nom_salle, sa.capacite
    HAVING COUNT(DISTINCT rs.siege_id) > sa.capacite
  LOOP
    RAISE NOTICE 'Dépassement dans salle %: % places réservées > % capacité', rec.nom_salle, rec.places_reservees, rec.capacite;
  END LOOP;
  
  -- Vérifie les réservations orphelines (sans séance)
  FOR rec IN
    SELECT r.id FROM reservation r
    LEFT JOIN seance s ON r.seance_id = s.id
    WHERE s.id IS NULL
  LOOP
    RAISE NOTICE 'Réservation orpheline détectée: id %', rec.id;
  END LOOP;
END; 
$$;
-- Name: avis; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.avis (
    id integer NOT NULL,
    utilisateur_id integer NOT NULL,
    film_id integer NOT NULL,
    contenu text,
    note integer,
    date_avis timestamp without time zone,
    statut_avis character varying(20) DEFAULT 'en_attente'::character varying,
    date_validation timestamp without time zone,
    validated_by integer,
    motif_refus text,
    CONSTRAINT check_statut_avis CHECK (((statut_avis)::text = ANY (ARRAY[('en_attente'::character varying)::text, ('valide'::character varying)::text, ('rejete'::character varying)::text])))
);
-- Name: avis_id_avis_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.avis_id_avis_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: avis_id_avis_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.avis_id_avis_seq OWNED BY public.avis.id;
-- Name: billet; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.billet (
    id integer NOT NULL,
    reservation_id integer,
    siege_id integer NOT NULL,
    statut_billet character varying DEFAULT 'valide'::character varying,
    tarif_id integer DEFAULT 1 NOT NULL,
    qr_code uuid DEFAULT gen_random_uuid(),
    prix_final numeric(6,2) DEFAULT 0 NOT NULL,
    date_utilisation_qr timestamp without time zone,
    date_expiration_qr timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    seance_id integer
);
-- Name: billet_billet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.billet_billet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: billet_billet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.billet_billet_id_seq OWNED BY public.billet.id;
-- Name: cinema; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.cinema (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    ville character varying(255) NOT NULL,
    adresse character varying(255),
    code_postal character varying(10),
    telephone character varying(20),
    pays character varying(50),
    horaire character varying(255)
);
-- Name: cinema_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.cinema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: cinema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.cinema_id_seq OWNED BY public.cinema.id;
-- Name: film; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.film (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    affiche character varying(255),
    age_min integer,
    duree integer NOT NULL,
    date_ajout timestamp with time zone,
    coup_coeur boolean DEFAULT false
);
-- Name: film_genre; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.film_genre (
    film_id integer NOT NULL,
    genre_id integer NOT NULL
);
-- Name: film_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.film_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: film_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.film_id_seq OWNED BY public.film.id;
-- Name: film_stats; Type: VIEW; Schema: public; Owner: -
CREATE VIEW public.film_stats AS
 SELECT f.id AS film_id,
    f.titre,
    count(a.id) FILTER (WHERE ((a.statut_avis)::text = 'valide'::text)) AS nb_avis,
    round(avg(a.note) FILTER (WHERE ((a.statut_avis)::text = 'valide'::text)), 1) AS note_moyenne
   FROM (public.film f
     LEFT JOIN public.avis a ON ((a.film_id = f.id)))
  GROUP BY f.id, f.titre;
-- Name: genre; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.genre (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    description text
);
-- Name: genre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.genre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.genre_id_seq OWNED BY public.genre.id;
-- Name: incident; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.incident (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    date_incident timestamp without time zone DEFAULT now(),
    date_resolution timestamp without time zone,
    statut character varying(50) DEFAULT 'ouvert'::character varying,
    priorite character varying(20) DEFAULT 'moyenne'::character varying,
    utilisateur_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    salle_id integer
);
-- Name: incident_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.incident_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: incident_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.incident_id_seq OWNED BY public.incident.id;
-- Name: paiement; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.paiement (
    id integer NOT NULL,
    reservation_id integer NOT NULL,
    reference_transaction character varying(255) NOT NULL,
    prestataire character varying(50) NOT NULL,
    montant numeric(8,2) NOT NULL,
    statut_paiement character varying(20) DEFAULT 'en_attente'::character varying NOT NULL,
    date_paiement timestamp without time zone DEFAULT now() NOT NULL
);
-- Name: paiement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.paiement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: paiement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.paiement_id_seq OWNED BY public.paiement.id;
-- Name: reservation; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.reservation (
    id integer NOT NULL,
    utilisateur_id integer,
    seance_id integer NOT NULL,
    nb_places integer DEFAULT 1 NOT NULL,
    prix_unitaire numeric DEFAULT 0 NOT NULL,
    statut_reservation public.enum_reservation_statut_reservation DEFAULT 'en_attente'::public.enum_reservation_statut_reservation,
    date_creation timestamp with time zone
);
-- Name: reservation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: reservation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.reservation_id_seq OWNED BY public.reservation.id;
-- Name: reservation_siege; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.reservation_siege (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    reservation_id integer NOT NULL,
    siege_id integer NOT NULL
);
-- Name: role; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.role (
    id integer NOT NULL,
    nom_role character varying(255) NOT NULL
);
-- Name: role_id_role_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.role_id_role_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: role_id_role_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.role_id_role_seq OWNED BY public.role.id;
-- Name: salle; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.salle (
    id integer NOT NULL,
    nom_salle character varying(255) NOT NULL,
    capacite integer NOT NULL,
    cinema_id integer,
    qualite_projection public.enum_salle_qualite_projection DEFAULT 'Standard'::public.enum_salle_qualite_projection,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);
-- Name: salle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.salle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: salle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.salle_id_seq OWNED BY public.salle.id;
-- Name: seance; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.seance (
    id integer NOT NULL,
    film_id integer,
    salle_id integer,
    date_heure_debut timestamp without time zone DEFAULT now() NOT NULL,
    date_heure_fin timestamp without time zone DEFAULT now() NOT NULL
);
-- Name: seance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.seance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: seance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.seance_id_seq OWNED BY public.seance.id;
-- Name: siege; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.siege (
    id integer NOT NULL,
    salle_id integer NOT NULL,
    rangee character varying(10) NOT NULL,
    numero_siege integer NOT NULL,
    type_siege public.type_siege_enum DEFAULT 'classique'::public.type_siege_enum NOT NULL,
    etat_siege public.etat_siege_enum DEFAULT 'Libre'::public.etat_siege_enum NOT NULL,
    statut_siege public.statut_siege_enum DEFAULT 'Disponible'::public.statut_siege_enum NOT NULL
);
-- Name: siege_siege_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.siege_siege_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: siege_siege_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.siege_siege_id_seq OWNED BY public.siege.id;
-- Name: tarif; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.tarif (
    id integer NOT NULL,
    nom_tarif character varying(50) NOT NULL,
    type_tarif character varying(30),
    prix_unitaire numeric(6,2) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
-- Name: tarif_id_tarif_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.tarif_id_tarif_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: tarif_id_tarif_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.tarif_id_tarif_seq OWNED BY public.tarif.id;
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.utilisateur (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    prenom character varying(255) NOT NULL,
    nom character varying(255) NOT NULL,
    username character varying(255),
    role_id integer NOT NULL,
    isconfirmed boolean DEFAULT false,
    mustchangepassword boolean DEFAULT false
);
-- Name: utilisateurs_tmp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.utilisateurs_tmp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: utilisateurs_tmp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.utilisateurs_tmp_id_seq OWNED BY public.utilisateur.id;
-- Name: avis id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.avis ALTER COLUMN id SET DEFAULT nextval('public.avis_id_avis_seq'::regclass);
-- Name: billet id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet ALTER COLUMN id SET DEFAULT nextval('public.billet_billet_id_seq'::regclass);
-- Name: cinema id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.cinema ALTER COLUMN id SET DEFAULT nextval('public.cinema_id_seq'::regclass);
-- Name: film id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.film ALTER COLUMN id SET DEFAULT nextval('public.film_id_seq'::regclass);
-- Name: genre id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.genre ALTER COLUMN id SET DEFAULT nextval('public.genre_id_seq'::regclass);
-- Name: incident id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.incident ALTER COLUMN id SET DEFAULT nextval('public.incident_id_seq'::regclass);
-- Name: paiement id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.paiement ALTER COLUMN id SET DEFAULT nextval('public.paiement_id_seq'::regclass);
-- Name: reservation id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation ALTER COLUMN id SET DEFAULT nextval('public.reservation_id_seq'::regclass);
-- Name: role id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_role_seq'::regclass);
-- Name: salle id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.salle ALTER COLUMN id SET DEFAULT nextval('public.salle_id_seq'::regclass);
-- Name: seance id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.seance ALTER COLUMN id SET DEFAULT nextval('public.seance_id_seq'::regclass);
-- Name: siege id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.siege ALTER COLUMN id SET DEFAULT nextval('public.siege_siege_id_seq'::regclass);
-- Name: tarif id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.tarif ALTER COLUMN id SET DEFAULT nextval('public.tarif_id_tarif_seq'::regclass);
-- Name: utilisateur id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.utilisateur ALTER COLUMN id SET DEFAULT nextval('public.utilisateurs_tmp_id_seq'::regclass);
-- Name: avis avis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_pkey PRIMARY KEY (id);
-- Name: billet billet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT billet_pkey PRIMARY KEY (id);
-- Name: billet billet_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT billet_qr_code_key UNIQUE (qr_code);
-- Name: tarif check-type_tarif; Type: CHECK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE public.tarif
    ADD CONSTRAINT "check-type_tarif" CHECK ((lower((type_tarif)::text) = ANY (ARRAY['réduit'::text, 'reduit'::text, 'normal'::text]))) NOT VALID;
-- Name: avis check_note; Type: CHECK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE public.avis
    ADD CONSTRAINT check_note CHECK (((note >= 1) AND (note <= 5))) NOT VALID;
-- Name: tarif check_prix_unitaire ; Type: CHECK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE public.tarif
    ADD CONSTRAINT "check_prix_unitaire " CHECK ((prix_unitaire >= (0)::numeric)) NOT VALID;
-- Name: billet check_statut_billet; Type: CHECK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE public.billet
    ADD CONSTRAINT check_statut_billet CHECK (((statut_billet)::text = ANY (ARRAY[('valide'::character varying)::text, ('utilise'::character varying)::text, ('annule'::character varying)::text]))) NOT VALID;
-- Name: siege chk_numero; Type: CHECK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE public.siege
    ADD CONSTRAINT chk_numero CHECK ((numero_siege > 0)) NOT VALID;
-- Name: cinema cinema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.cinema
    ADD CONSTRAINT cinema_pkey PRIMARY KEY (id);
-- Name: film_genre film_genre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.film_genre
    ADD CONSTRAINT film_genre_pkey PRIMARY KEY (film_id, genre_id);
-- Name: film film_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.film
    ADD CONSTRAINT film_pkey PRIMARY KEY (id);
-- Name: genre genre_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.genre
    ADD CONSTRAINT genre_nom_key UNIQUE (nom);
-- Name: genre genre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.genre
    ADD CONSTRAINT genre_pkey PRIMARY KEY (id);
-- Name: incident incident_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incident
    ADD CONSTRAINT incident_pkey PRIMARY KEY (id);
-- Name: paiement paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT paiement_pkey PRIMARY KEY (id);
-- Name: reservation reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_pkey PRIMARY KEY (id);
-- Name: reservation_siege reservation_siege_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation_siege
    ADD CONSTRAINT reservation_siege_pkey PRIMARY KEY (reservation_id, siege_id);
-- Name: role role_nom_role_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_nom_role_key UNIQUE (nom_role);
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);
-- Name: salle salle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.salle
    ADD CONSTRAINT salle_pkey PRIMARY KEY (id);
-- Name: seance seance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.seance
    ADD CONSTRAINT seance_pkey PRIMARY KEY (id);
-- Name: siege siege_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.siege
    ADD CONSTRAINT siege_pkey PRIMARY KEY (id);
-- Name: tarif tarif_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tarif
    ADD CONSTRAINT tarif_pkey PRIMARY KEY (id);
-- Name: paiement unique_paiement_reservation; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT unique_paiement_reservation UNIQUE (reservation_id);
-- Name: billet unique_siege_par_seance; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT unique_siege_par_seance UNIQUE (siege_id, seance_id);
-- Name: siege uq-siege; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.siege
    ADD CONSTRAINT "uq-siege" UNIQUE (salle_id, rangee, numero_siege);
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);
-- Name: utilisateur utilisateurs_tmp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateurs_tmp_pkey PRIMARY KEY (id);
-- Name: utilisateur utilisateurs_tmp_username_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateurs_tmp_username_key UNIQUE (username);
-- Name: avis_date_avis; Type: INDEX; Schema: public; Owner: -
CREATE INDEX avis_date_avis ON public.avis USING btree (date_avis);
-- Name: avis_film_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX avis_film_id ON public.avis USING btree (film_id);
-- Name: avis_statut_avis; Type: INDEX; Schema: public; Owner: -
CREATE INDEX avis_statut_avis ON public.avis USING btree (statut_avis);
-- Name: avis_utilisateur_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX avis_utilisateur_id ON public.avis USING btree (utilisateur_id);
-- Name: fki_fk_salle_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX fki_fk_salle_id ON public.siege USING btree (salle_id);
-- Name: idx_billet_qrcode; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_billet_qrcode ON public.billet USING btree (qr_code);
-- Name: idx_billet_reservation; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_billet_reservation ON public.billet USING btree (reservation_id) INCLUDE (reservation_id) WITH (deduplicate_items='true');
-- Name: idx_billet_siege; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_billet_siege ON public.billet USING btree (siege_id) INCLUDE (siege_id) WITH (deduplicate_items='true');
-- Name: idx_billet_statut; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_billet_statut ON public.billet USING btree (statut_billet) INCLUDE (statut_billet) WITH (deduplicate_items='true');
-- Name: idx_siege_pmr; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_siege_pmr ON public.siege USING btree (type_siege);
-- Name: idx_siege_salle; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_siege_salle ON public.siege USING btree (salle_id);
-- Name: salle_cinema_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX salle_cinema_id ON public.salle USING btree (cinema_id);
-- Name: unique_avis_per_user_per_film; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX unique_avis_per_user_per_film ON public.avis USING btree (film_id, utilisateur_id);
-- Name: unique_salle_par_cinema; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX unique_salle_par_cinema ON public.salle USING btree (nom_salle, cinema_id);
-- Name: unique_siege_per_salle; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX unique_siege_per_salle ON public.siege USING btree (salle_id, rangee, numero_siege);
-- Name: avis avis_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.utilisateur(id);
-- Name: avis fk_avis_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.avis
    ADD CONSTRAINT fk_avis_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE CASCADE NOT VALID;
-- Name: billet fk_billet_reservation; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT fk_billet_reservation FOREIGN KEY (reservation_id) REFERENCES public.reservation(id) ON DELETE CASCADE NOT VALID;
-- Name: billet fk_billet_seance; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT fk_billet_seance FOREIGN KEY (seance_id) REFERENCES public.seance(id) ON DELETE CASCADE;
-- Name: incident fk_incident_salle; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incident
    ADD CONSTRAINT fk_incident_salle FOREIGN KEY (salle_id) REFERENCES public.salle(id) ON DELETE SET NULL;
-- Name: incident fk_incident_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incident
    ADD CONSTRAINT fk_incident_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE SET NULL;
-- Name: paiement fk_paiement_reservation; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT fk_paiement_reservation FOREIGN KEY (reservation_id) REFERENCES public.reservation(id) ON DELETE CASCADE;
-- Name: reservation fk_reservation_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT fk_reservation_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE SET NULL NOT VALID;
-- Name: billet fk_siege_id; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT fk_siege_id FOREIGN KEY (siege_id) REFERENCES public.siege(id) ON DELETE RESTRICT NOT VALID;
-- Name: billet fk_tarif_id; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.billet
    ADD CONSTRAINT fk_tarif_id FOREIGN KEY (tarif_id) REFERENCES public.tarif(id) ON DELETE SET NULL NOT VALID;
-- Name: reservation reservation_seance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_seance_id_fkey FOREIGN KEY (seance_id) REFERENCES public.seance(id) ON UPDATE CASCADE ON DELETE CASCADE;
-- Name: reservation_siege reservation_siege_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation_siege
    ADD CONSTRAINT reservation_siege_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservation(id) ON UPDATE CASCADE ON DELETE CASCADE;
-- Name: reservation_siege reservation_siege_siege_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reservation_siege
    ADD CONSTRAINT reservation_siege_siege_id_fkey FOREIGN KEY (siege_id) REFERENCES public.siege(id) ON UPDATE CASCADE ON DELETE CASCADE;
-- Name: salle salle_cinema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.salle
    ADD CONSTRAINT salle_cinema_id_fkey FOREIGN KEY (cinema_id) REFERENCES public.cinema(id) ON UPDATE CASCADE ON DELETE SET NULL;
-- Name: seance seance_salle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.seance
    ADD CONSTRAINT seance_salle_id_fkey FOREIGN KEY (salle_id) REFERENCES public.salle(id) ON UPDATE CASCADE ON DELETE SET NULL;
-- Name: utilisateur utilisateur_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id) ON UPDATE CASCADE;
-- PostgreSQL database dump complete
