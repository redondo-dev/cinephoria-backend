import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from "../src/routes/auth/auth.routes.js";
import protectedRoutes from "../src/routes/auth/protected.routes.js";



const app = express();

// Middleware pour parser le JSON
app.use(express.json());
app.use(cookieParser()); // pour lire les cookies

app.use('/api/auth/', authRoutes);
app.use("/api", protectedRoutes);



export default app;

