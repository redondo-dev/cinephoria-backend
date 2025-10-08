import express from 'express';
import protectedRoutes from "../src/routes/auth/protected.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";


const app = express();
app.use(cors());
// Middleware pour parser le JSON
app.use(express.json());

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

export default app;

