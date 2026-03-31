// ----------------------------
// 🏗 IMPORTS
// ----------------------------

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import setupSwagger from "./config/swagger.config.js";

// 👉 Routes publiques
import publicFilmRoutes from "../src/routes/public/public.films.routes.js"
import publicCinemaRoutes from "../src/routes/public/public.cinemas.routes.js";
import publicReservationRoutes from './routes/public/public.reservations.routes.js';
import publicSeancesRoutes from './routes/public/public.seance.routes.js';

// 👉 Routes d’authentification
import authRoutes from "../src/routes/auth/auth.routes.js";
import protectedRoutes from "../src/routes/auth/protected.routes.js";

// 👉 Routes protégées
import adminRoutes from "../src/routes/admin.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import contactRoutes from "../src/routes/contact.routes.js";

// 👉 Middlewares
import { authenticate, isAdmin, isClient, isAdminOrEmploye } from "../src/middleware/auth.middleware.js";


// ----------------------------
//  INITIALISATION APP
// ----------------------------

const app = express();

// ----------------------------
// 🔐 MIDDLEWARES GLOBAUX
// ----------------------------

// Helmets → sécurise les headers HTTP
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
     contentSecurityPolicy: false 
}));

const allowedOrigins = [
  // Vos domaines Vercel (ajoutez TOUS vos domaines)
  // process.env.FRONTEND_URL,
  // 'https://cinephoria-alpha.vercel.app',
  // 'https://cinephoria-frontend.vercel.app',
  // 'https://frontend-eight-xi-87.vercel.app',
  // 'https://frontend-fftl68tcd-riads-projects-4e98048c.vercel.app',
  
  // Pattern pour tous les déploiements Vercel (preview + production)
  /^https:\/\/.*\.vercel\.app$/,
   /^https:\/\/cinephoria-.*\.vercel\.app$/,
  /^https:\/\/.*-riads-projects-4e98048c\.vercel\.app$/,
  
  // Développement local
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (Postman)
    if (!origin) {
      console.log('[CORS] Requête sans origin (outil/serveur)');
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      // Pour les RegExp
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      console.log(' [CORS] Origine autorisée:', origin);
      callback(null, true);
    } else {
      console.log(' [CORS] Origine refusée:', origin);
      // callback(new Error(`CORS: Origine ${origin} non autorisée`));
        callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight 24h
}));



// Parse JSON et URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies (JWT en HttpOnly)
app.use(cookieParser());

// ----------------------------
// ⏳ LIMITER POUR LA ROUTE CONTACT
// ----------------------------
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requêtes
  message:{ success: false,
  message: "Trop de requêtes de contact, veuillez réessayer plus tard."
}
 
});

app.use((req, res, next) => {
  console.log(` ${req.method} ${req.url}`);
  next();
});

// Routes API PUBLIQUES 
app.use('/api/auth', authRoutes);
app.use('/api/films', publicFilmRoutes);
app.use('/api/cinemas', publicCinemaRoutes);
app.use('/api/seances', publicSeancesRoutes);
app.use('/api/public/reservations', publicReservationRoutes);
app.use('/contact', contactLimiter, contactRoutes);


// 🔐 Routes PROTÉGÉES (JWT requis)

app.use('/api/reservations', authenticate, reservationRoutes);
app.use('/api/admin', authenticate,isAdmin, adminRoutes);
app.use('/api/user' ,userRoutes);
app.use('/api/employee', authenticate,isAdminOrEmploye ,employeeRoutes);


app.use('/api/protected', authenticate, protectedRoutes);

// ----------------------------
// 📤 EXPORT SERVEUR
// -------------------------


setupSwagger(app);

export default app;
