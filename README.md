# 🎬 Cinephoria - Application de Gestion de Cinéma

Application web full-stack moderne de gestion et réservation de cinéma développée avec Angular 19 et Node.js.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Développement](#développement)
- [API Documentation](#api-documentation)
- [Structure du projet](#structure-du-projet)
- [Tests](#tests)
- [Déploiement](#déploiement)

## 🎯 Vue d'ensemble

Cinephoria est une plateforme complète de gestion de cinéma offrant trois interfaces distinctes :

- 🎭 **Interface Client** : Réservation de places, consultation des films, gestion de compte
- 👨‍💼 **Interface Employé** : Gestion des séances, salles et modération des avis
- 🔐 **Interface Admin** : Gestion complète du système (films, employés, salles, séances)

## 🏗️ Architecture

### Stack Technique

```
┌─────────────────────────────────────────┐
│         Frontend (Angular 19)           │
│  ┌───────────┐  ┌──────────────────┐   │
│  │ Components│  │   Core Services  │   │
│  │   Guards  │  │   Interceptors   │   │
│  └───────────┘  └──────────────────┘   │
└─────────────────────────────────────────┘
                    ↕ REST API
┌─────────────────────────────────────────┐
│         Backend (Node.js/Express)       │
│  ┌───────────┐  ┌──────────────────┐   │
│  │Controllers│  │   Middleware     │   │
│  │  Models   │  │     Routes       │   │
│  └───────────┘  └──────────────────┘   │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│    Bases de données                     │
│  MySQL (SQL)  +  MongoDB (NoSQL)        │
└─────────────────────────────────────────┘
```

### Architecture Backend

- **API REST** avec Express.js
- **Base de données hybride** :
  - MySQL (Sequelize ORM) : Données relationnelles (films, salles, séances, utilisateurs)
  - MongoDB : Réservations et données non structurées
- **Authentification JWT** avec middleware de sécurité
- **Validation des données** avec middlewares personnalisés
- **Documentation API** avec Swagger

## ✨ Fonctionnalités

### 🎭 Espace Client
- 🎥 Consultation du catalogue de films avec détails complets
- 🎫 Système de réservation de places avec sélection interactive de sièges
- 💳 Paiement en ligne sécurisé (Carte bancaire & PayPal)
- 📱 Génération de QR codes pour les réservations
- ⭐ Système d'avis et notation des films
- 👤 Gestion du profil utilisateur
- 📜 Historique des commandes et réservations
- 📧 Confirmation par email

### 👨‍💼 Espace Employé
- 📊 Dashboard dédié avec statistiques
- 🎬 Gestion des films (consultation, modification)
- 🏛️ Gestion des salles de cinéma
- 🕐 Gestion du planning des séances
- 💬 Modération des avis clients
- 💰 Gestion des tarifs

### 🔐 Espace Administrateur
- 📈 Dashboard administratif avec analytics
- 👥 CRUD complet des employés
- 🎞️ CRUD complet des films (ajout, modification, suppression)
- 🪑 Gestion des salles et configurations de sièges
- 🕐 Gestion complète du planning des séances
- 🎫 Gestion des cinémas
- 📊 Statistiques globales

### 🔒 Sécurité
- Authentification JWT
- Guards de protection des routes par rôle
- Middleware de validation des données
- Protection XSS
- Hashage des mots de passe (bcrypt)
- Gestion des tokens de réinitialisation
- Emails de confirmation

## 🛠️ Technologies
### Backend
- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** :
  - MySQL (Sequelize ORM)
  - MongoDB (Mongoose)
- **Authentification** : JWT (jsonwebtoken)
- **Sécurité** :
  - bcrypt - Hashage mots de passe
  - cors - Gestion CORS
  - helmet - Sécurité HTTP headers
  - xss-clean - Protection XSS
  - express-validator - Validation données
- **Email** : Nodemailer
- **Documentation** : Swagger
- **Validation** : validator.js, z-schema
- **Utilitaires** : 
  - dotenv - Variables d'environnement
  - uuid - Génération d'identifiants
  - yaml - Configuration

### DevOps & Tools
- **Testing** : Jasmine, Karma
- **Version Control** : Git
- **Package Manager** : npm
- **Build** : Angular CLI, Webpack

## 📦 Installation

### Prérequis
- Node.js v18+ et npm v9+
- MySQL 8.0+
- MongoDB 6.0+
- Angular CLI 19.2.18

### 1. Cloner le repository
```bash
git clone https://github.com/votre-repo/cinephoria.git
cd cinephoria
```

### 2. Installation Backend
```bash
cd backend
npm install
```

### 3. Installation Frontend
```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Créer le fichier `.env`** dans le dossier `backend/` :
```env
# Serveur
PORT=8080
NODE_ENV=development

# Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=cinephoria
DB_DIALECT=mysql

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cinephoria

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app
EMAIL_FROM=noreply@cinephoria.com

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:8080
```

2. **Créer les bases de données** :
```sql
CREATE DATABASE cinephoria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Initialiser MongoDB** :
```bash
# Démarrer MongoDB
mongod

# Créer la base
mongosh
use cinephoria
```



## 🚀 Développement

### Démarrer le Backend
```bash
cd backend
npm start
# ou en mode développement avec hot-reload
npm run dev
```
Le serveur démarre sur `http://localhost:8080`

### Démarrer le Frontend
```bash
cd frontend
npm start
# ou
ng serve
```
L'application démarre sur `http://localhost:4200`

### Scripts disponibles

#### Backend
```bash
npm start          # Démarrer le serveur
npm run dev        # Mode développement avec nodemon
npm test           # Lancer les tests
npm run swagger    # Générer la documentation Swagger
```

## 📚 API Documentation

La documentation complète de l'API est disponible via Swagger :
```
http://localhost:8080/api-docs
```

### Endpoints principaux

#### Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `POST /confirm` - Confirmation email
- `POST /reset-password` - Réinitialisation mot de passe

#### Public (`/api/public`)
- `GET /films` - Liste des films
- `GET /films/:id` - Détails d'un film
- `GET /seances` - Liste des séances
- `GET /cinemas` - Liste des cinémas
- `GET /sieges` - Disponibilité des sièges

#### Utilisateur (`/api/user`)
- `GET /profil` - Profil utilisateur
- `PUT /profil` - Mise à jour profil
- `GET /commandes` - Historique commandes
- `POST /avis` - Créer un avis

#### Réservations (`/api/reservations`)
- `POST /` - Créer une réservation
- `GET /:id` - Détails réservation
- `GET /user/:userId` - Réservations utilisateur

#### Employé (`/api/employee`)
- `GET /dashboard` - Statistiques
- `GET /films` - Gestion films
- `GET /seances` - Gestion séances
- `GET /avis` - Modération avis
- `PUT /avis/:id` - Approuver/Rejeter avis

#### Admin (`/api/admin`)
- `GET /dashboard` - Dashboard admin
- `CRUD /employees` - Gestion employés
- `CRUD /films` - Gestion films
- `CRUD /salles` - Gestion salles
- `CRUD /seances` - Gestion séances
- `CRUD /cinemas` - Gestion cinémas

## 📁 Structure du projet

### Backend
```
backend/
├── src/
│   ├── config/               # Configuration (DB, Swagger, env)
│   │   ├── database.js       # Config MySQL
│   │   ├── mongo.js          # Config MongoDB
│   │   ├── env.js            # Variables environnement
│   │   └── swagger.config.js # Config Swagger
│   ├── controllers/          # Contrôleurs
│   │   ├── admin/            # Contrôleurs admin
│   │   ├── auth/             # Authentification
│   │   ├── employee/         # Contrôleurs employé
│   │   ├── public/           # Endpoints publics
│   │   ├── user/             # Contrôleurs utilisateur
│   │   └── reservation.controller.js
│   ├── middleware/           # Middlewares
│   │   ├── auth.middleware.js
│   │   └── contact.middleware.js
│   ├── models/               # Modèles Sequelize
│   │   ├── user.model.js
│   │   ├── film.model.js
│   │   ├── salle.model.js
│   │   ├── seance.model.js
│   │   ├── reservation.model.js
│   │   ├── avis.model.js
│   │   ├── cinema.model.js
│   │   ├── genre.model.js
│   │   ├── role.model.js
│   │   ├── siege.model.js
│   │   ├── tarif.model.js
│   │   └── index.js
│   ├── routes/               # Routes Express
│   │   ├── auth/
│   │   ├── public/
│   │   ├── admin.routes.js
│   │   ├── employee.routes.js
│   │   ├── user.routes.js
│   │   ├── contact.routes.js
│   │   └── reservation.routes.js
│   ├── utils/                # Utilitaires
│   │   ├── emailContact.js
│   │   ├── sendEmailConfirmation.js
│   │   ├── sendTemporaryPassword.js
│   │   ├── validateEmail.js
│   │   └── validatePassword.js
│   ├── app.js                # Configuration Express
│   └── server.js             # Point d'entrée serveur
├── tests/                    # Tests
├── .env                      # Variables environnement
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── components/       # Composants
│   │   │   ├── admin/        # Module admin
│   │   │   ├── employes/     # Module employés
│   │   │   ├── users/        # Module utilisateurs
│   │   │   ├── films/        # Gestion films
│   │   │   ├── reservation/  # Système réservation
│   │   │   ├── seances/      # Gestion séances
│   │   │   ├── contact/      # Page contact
│   │   │   ├── home/         # Accueil
│   │   │   ├── login/        # Connexion
│   │   │   └── register/     # Inscription
│   │   ├── core/             # Services centraux
│   │   │   ├── guards/       # Guards auth
│   │   │   ├── interceptors/ # HTTP interceptors
│   │   │   ├── models/       # Modèles TypeScript
│   │   │   └── services/     # Services métier
│   │   ├── shared/           # Composants partagés
│   │   │   ├── navbar/
│   │   │   └── footer/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/         # Configuration env
│   ├── styles.scss           # Styles globaux
│   └── index.html
├── public/                   # Assets statiques
└── package.json
```

## 🧪 Tests

### Backend Tests
```bash
cd backend
npm test

# Tests spécifiques
npm test -- auth.controller.test.js
npm test -- reservation.controller.test.js
```

### Frontend Tests
```bash
cd frontend
npm test

# Avec couverture de code
ng test --code-coverage
```

## 🚢 Déploiement

### Build de production

#### Backend
```bash
cd backend
# Pas de build nécessaire, Node.js exécute directement
NODE_ENV=production npm start
```


## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

Développé avec ❤️ Riad reda fethi developpeur etudiant chez studi
## 📞 Support

- 📧 Email : support@cinephoria.com
- 🐛 Issues : [GitHub Issues](https://github.com/votre-repo/cinephoria/issues)
- 📖 Documentation : [Wiki](https://github.com/votre-repo/cinephoria/wiki)

---

**Version**: 1.0.0  
**Dernière mise à jour**: Novembre 20/11/2025
**Angular**: 19.2 | **Node.js**: 18+ | **MySQL**: 8.0+ | **MongoDB**: 6.0+
