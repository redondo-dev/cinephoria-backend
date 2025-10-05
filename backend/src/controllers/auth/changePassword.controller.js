// src/controllers/auth/changePassword.controller.js
import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import { validatePassword } from "../../utils/validatePassword.js";

export const changeTempPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword)
      return res.status(400).json({ message: "userId et nouveau mot de passe requis" });

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Mot de passe invalide : min 8 caractères, majuscule, minuscule, chiffre et caractère spécial"
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (!user.mustChangePassword) {
      return res.status(400).json({ message: "Le changement de mot de passe n'est pas obligatoire" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ message: "Mot de passe changé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du changement de mot de passe", error: err.message });
  }
};
