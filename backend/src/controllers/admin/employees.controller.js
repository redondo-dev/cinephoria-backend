// src/controllers/admin/employees.controller.js
import bcrypt from "bcrypt";
import { User,Role} from "../../models/index.js";

export const createEmployee = async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const { email, password, prenom, nom, username} = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      nom,
      prenom,
      email,
      username,
      password: hashedPassword,
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



export const getEmployes = async (req, res) => {
  try {
    // Récupérer le role_id de "employe" depuis la table roles
    const employeRole = await Role.findOne({ 
      where: { nom_role: 'employe' } 
    });

    if (!employeRole) {
      return res.status(404).json({ message: "Rôle employé non trouvé" });
    }
// Récupérer tous les utilisateurs avec le role_id d'employé
    const employes = await User.findAll({
      where: { role_id: employeRole.id },
      attributes: ['id', 'email', 'nom', 'prenom'], // Exclure le mot de passe
      include: [{
        model: Role,
        as: 'roleDetails',
        attributes: ['nom_role']
      }]
    });

    // Formater la réponse
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
    const { nom , prenom , email, username , password } = req.body;

    const employee = await User.findByPk(id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }
// Hash le mot de passe uniquement si un nouveau mot de passe est fourni
    const updatedData = {
      nom: nom || employee.nom,
      prenom: prenom || employee.prenom,
      email: email || employee.email,
      username: username || employee.username
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    // Mise à jour de l'employé
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