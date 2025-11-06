import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import setupSwagger from "./config/swagger.config.js";

import publicFilmRoutes from "../src/routes/public/public.films.routes.js"
import authRoutes from "../src/routes/auth/auth.routes.js";
import protectedRoutes from "../src/routes/auth/protected.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import contactRoutes from "../src/routes/contact.routes.js";
import { authorizeRoles, verifyToken } from "../src/middleware/auth.middleware.js";
import publicCinemaRoutes from "../src/routes/public/public.cinemas.routes.js";
import publicReservationRoutes from './routes/public/public.reservations.routes.js';




const app = express();

// Middleware globaux
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiter spécifique pour la route contact
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requêtes
  message: "Trop de requêtes de contact, veuillez réessayer plus tard."
});



// Routes API PUBLIQUES 
app.use('/api/auth', authRoutes);
app.use('/api/films', publicFilmRoutes);
app.use('/api/cinemas', publicCinemaRoutes);
app.use('/api/public/reservations', publicReservationRoutes);
app.use('/contact', contactLimiter, contactRoutes);


// 🔐 Routes PROTÉGÉES (JWT requis)

app.use('/api/reservations', verifyToken, reservationRoutes);

app.use('/api/user', verifyToken, userRoutes);
app.use('/api/employee', verifyToken, employeeRoutes);
app.use('/api/admin', verifyToken,authorizeRoles('admin'), adminRoutes);

app.use('/api/protected', verifyToken, protectedRoutes);

// Documentation Swagger


setupSwagger(app);

export default app;
