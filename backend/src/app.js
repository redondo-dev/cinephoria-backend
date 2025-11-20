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
// 🚀 INITIALISATION APP
// ----------------------------

const app = express();

// ----------------------------
// 🔐 MIDDLEWARES GLOBAUX
// ----------------------------

// Helmets → sécurise les headers HTTP
app.use(helmet());

// CORS → autorise le frontend Angular
app.use(cors({
  origin: ['http://localhost:4200',
    'http://localhost:3000',
    'https://cinephoria-frontend.vercel.app',
    'https://*.vercel.app',
    'https://cinephoria-evpf82dkl-riads-projects-4e98048c.vercel.app',
    'https://cinephoria-backend-i6be.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
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
  console.log(`📥 ${req.method} ${req.url}`);
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
app.use('/api/user', authenticate,isClient ,userRoutes);
app.use('/api/employee', authenticate,isAdminOrEmploye ,employeeRoutes);


app.use('/api/protected', authenticate, protectedRoutes);

// ----------------------------
// 📤 EXPORT SERVEUR
// -------------------------


setupSwagger(app);


// ----------------------------
// 📤 EXPORT SERVEUR
// ----------------------------
export default app;
