import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from "../src/routes/auth/auth.routes.js";
import protectedRoutes from "../src/routes/auth/protected.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import contactRoutes from "../src/routes/contact.routes.js";

const app = express();

// Middleware globaux
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
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
app.use('/contact', contactLimiter, contactRoutes);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/reservations', reservationRoutes);

// Routes admin / employee / user
app.use('/admin', adminRoutes);
app.use('/employee', employeeRoutes);
app.use('/user', userRoutes);

export default app;
