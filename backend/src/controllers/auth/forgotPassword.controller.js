// src/controllers/auth/forgotPassword.controller.js

import User from "../../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendTemporaryPassword } from "../../utils/sendTemporaryPassword.js";


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    // Vérification si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });



    // Génération d'un nouveau mot de passe temporaire
    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 caractères
    const hashedPassword = await bcrypt.hash(tempPassword, 10);


    user.password = hashedPassword;
    user.mustChangePassword = true; // obligatoire à la prochaine connexion
    await user.save();

    // Envoi du mot de passe temporaire par email
    await sendTemporaryPassword(email, tempPassword);

    res.status(200).json({
      message: "Un mot de passe temporaire vous a été envoyé par email. Vous devriez le changer à la prochaine connexion."
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
