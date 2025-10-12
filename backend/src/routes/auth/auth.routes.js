// src/routes/auth.routes.js
import express from "express";
import { login, logout,forgotPassword,changeTempPassword,forgotPasswordVisitor} from "../../controllers/auth/auth.controller.js";
import { confirmEmail } from "../../controllers/auth/confirm.controller.js";
import { register,registerWithTempPassword } from "../../controllers/auth/register.controller.js";
import { resetPassword } from "../../controllers/auth/auth.controller.js";

const router = express.Router();


// Création compte standard (visiteur, utilisateur)
router.post("/register", register);

// Création compte avec mot de passe temporaire (admin, employé)
router.post("/register-temp", registerWithTempPassword);

// Confirmation compte par lien email
router.get ("/confirm/:token", confirmEmail);   

// Mot de passe oublié → envoi mot de passe temporaire
router.post("/forgot-password", forgotPassword);   

// Changer le mot de passe temporaire
router.post ("/change-temp-password",changeTempPassword);  

// Login, Logout
router.post("/login", login);
router.post("/logout", logout);
router.post('/forgot-password-visiteur', forgotPasswordVisitor);
router.post("/reset-password", resetPassword);


export default router;
