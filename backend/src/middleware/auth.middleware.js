// src/middleware/auth.middleware.js

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware pour vérifier le JWT
 const authenticateToken = (req, res, next) => {
  // Récupérer le token dans le header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Token manquant" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token invalide" });
    req.user = user; // ajout des infos de l'utilisateur à la requête
    next();
  });
};
export default authenticateToken;

