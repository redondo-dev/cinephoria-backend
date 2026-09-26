// src/controllers/admin/employees.controller.js


import bcrypt from "bcrypt";
import crypto from "crypto";
import { User, Role } from "../../models/index.js";
import { validatePassword } from "../../utils/validatePassword.js";
import { sendTemporaryPassword } from "../../utils/sendTemporaryPassword.js";

export const createEmployee = async (req, res) => {
  try {
    const { email, password, prenom, nom, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Mot de passe invalide : min 8 caractères, majuscule, minuscule, chiffre et caractère spécial"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      nom,
      prenom,
      email,
      username,
      password: hashedPassword,
      role_id: 3, // id du rôle "employé"
      isConfirmed: true,
      mustChangePassword: false
    });

    res.status(201).json({ message: "Employé créé avec succès", employe: newEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Réinitialiser mot de passe : génère un mot de passe temporaire (comme forgotPassword),

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 caractères
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    employee.password = hashedPassword;
    employee.mustChangePassword = true; // obligatoire à la prochaine connexion
    await employee.save();

    await sendTemporaryPassword(employee.email, tempPassword);

    res.json({ message: "Mot de passe réinitialisé. Un mot de passe temporaire a été envoyé à l'employé par email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployes = async (req, res) => {
  try {
    const employeRole = await Role.findOne({
      where: { nom_role: 'employe' }
    });

    if (!employeRole) {
      return res.status(404).json({ message: "Rôle employé non trouvé" });
    }

    const employes = await User.findAll({
      where: { role_id: employeRole.id },
      attributes: ['id', 'email', 'nom', 'prenom'],
      include: [{
        model: Role,
        as: 'roleDetails',
        attributes: ['nom_role']
      }]
    });

    const formattedEmployes = employes.map(emp => ({
      id: emp.id,
      login: emp.email,
      nom: emp.nom,
      prenom: emp.prenom,
      email: emp.email
    }));

    res.json(formattedEmployes);
  } catch (error) {
    console.error('Erreur récupération employés:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employe = await User.findByPk(id, {
      attributes: ['id', 'nom', 'prenom', 'email', 'username', 'role_id'],
    });

    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    res.status(200).json(employe);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'employé:", error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, username, password } = req.body;

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    if (password && !validatePassword(password)) {
      return res.status(400).json({
        message: "Mot de passe invalide : min 8 caractères, majuscule, minuscule, chiffre et caractère spécial"
      });
    }

    const updatedData = {
      nom: nom || employee.nom,
      prenom: prenom || employee.prenom,
      email: email || employee.email,
      username: username || employee.username
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await employee.update(updatedData);

    res.json({ message: "Employé mis à jour avec succès" });
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    await User.destroy({ where: { id } });

    res.json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    console.error('Erreur suppression employé:', error);
    res.status(500).json({ message: error.message });
  }
};