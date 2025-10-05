import express from "express";
import { register, registerWithTempPassword  } from "../controllers/auth/register.controller.js";
import { confirmEmail } from "../controllers/auth/confirm.controller.js";
import { forgotPassword } from "../controllers/auth/forgotPassword.controller.js";
import { changeTempPassword } from "../controllers/auth/changePassword.controller.js";



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


export default router;
