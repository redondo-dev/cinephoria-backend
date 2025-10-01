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



// Mettre à jour un employé
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que l'utilisateur existe et est un employé
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    if (user.role_id !== 3) {
      return res.status(403).json({ 
        message: "Cet utilisateur n'est pas un employé" 
      });
    }

    // Ne pas permettre la modification du mot de passe via cette route
    if (updates.password) {
      return res.status(400).json({ 
        message: "Utilisez la route de réinitialisation pour changer le mot de passe" 
      });
    }

    // Ne pas permettre de changer le role_id
    delete updates.role_id;

    await User.update(id, updates);

    res.json({ 
      message: "Employé mis à jour avec succès",
      employeeId: id 
    });
  } catch (error) {
    console.error("Erreur mise à jour employé:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

// Supprimer un employé
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    if (user.role_id !== 3) {
      return res.status(403).json({ 
        message: "Cet utilisateur n'est pas un employé" 
      });
    }

    await User.delete(id);

    res.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression employé:", error);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};