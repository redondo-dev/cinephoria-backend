import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from "../src/routes/auth/auth.routes.js";
import protectedRoutes from "../src/routes/auth/protected.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import reservationRoutes from "../src/routes/reservation.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";
import userRoutes from "../src/routes/user.routes.js";

const app = express();
app.use(cors());
// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // pour lire les cookiesconst app = express();


app.use('/api/auth/', authRoutes);
app.use("/api", protectedRoutes);

app.use("/api/reservations", reservationRoutes);
// Routes Admin protégées
app.use("/admin", adminRoutes);
app.use('/employee',employeeRoutes);
app.use('/user',userRoutes);

export default app;

