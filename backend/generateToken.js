// generateToken.js
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
const payload = {
  id: 1,
  email: "admin@example.com",
  role: "admin", // pour passer le middleware isAdmin
};

const token = jwt.sign(payload, "MaSuperCleSecrete123!", { expiresIn: "1d" });

console.log("Token généré :", token);

const hash = await bcrypt.hash('Client123!', 10);
console.log(hash);