// src/controllers/admin.controller.js
import bcrypt from "bcrypt";
import { User } from "../models/index.js";

export const createEmployee = async (req, res) => {
  try {
    const { email, password, prenom, nom, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      username,
      role_id: 3, // id du rôle "employé" `)
      isConfirmed: true,
      mustChangePassword: false
    });

    res.status(201).json({ message: "Employé créé avec succès", employe: newEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Réinitialiser mot de passe
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);

    await User.update({ password: hash }, { where: { id } });
    res.json({ message: "Mot de passe réinitialisé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};