// generateToken.js
import jwt from "jsonwebtoken";

const payload = {
  id: 1,
  email: "admin@example.com",
  role: "admin", // pour passer le middleware isAdmin
};

const token = jwt.sign(payload, "MaSuperCleSecrete123!", { expiresIn: "1d" });

console.log("Token généré :", token);
