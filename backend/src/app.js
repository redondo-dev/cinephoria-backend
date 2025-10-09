import express from 'express';
import protectedRoutes from "../src/routes/auth/protected.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import helmet from "helmet";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";

import contactRoutes from "../src/routes/contact.routes.js";

const app = express();
app.use(cors());
// Middleware pour parser le JSON
app.use(express.json());
app.use(helmet());
app.use(xssClean());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
}));

// Routes pour les réservations
app.use('/api/reservations', reservationRoutes);

app.use(cookieParser()); // pour lire les cookies

app.use('/api/auth/', authRoutes);
app.use("/api", protectedRoutes);

app.use("/api/reservations", reservationRoutes);
// Routes Admin protégées
app.use("/admin", adminRoutes);
app.use('/employee',employeeRoutes);
app.use('/user',userRoutes);

// Middleware de sécurité
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Trop de requêtes de contact, veuillez réessayer plus tard."
});
app.use('/contact', limiter,contactRoutes);

export default app;

