// utils/setTemporaryPasswordForUser.js
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendTemporaryPassword } from "./sendTemporaryPassword.js";

export const setTemporaryPasswordForUser = async (user, { expiresInHours = 24 } = {}) => {
  // 1️- Génération d’un mot de passe temporaire
  const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 caractères

  // 2 Hashage
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // 3- Mise à jour utilisateur
  await user.update({
    password: hashedPassword,
    mustChangePassword: true,
    tempPasswordExpiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000)
  });

  // 4️- Envoi de l'email
  await sendTemporaryPassword(user.email, tempPassword);
};
