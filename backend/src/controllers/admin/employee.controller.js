import User from '../../models/User.js';
import bcrypt from 'bcrypt';

// Créer un employé
export const createEmployee = async (req, res) => {
  try {
    const { email, password, prenom, nom, username, cinema_id } = req.body;

    // Validation
    if (!email || !password || !prenom || !nom || !username) {
      return res.status(400).json({ 
        message: "Email, mot de passe, prénom, nom et username sont obligatoires" 
      });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ 
        message: "Cet email est déjà utilisé" 
      });
    }

    // Vérifier si le username existe déjà
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ 
        message: "Ce nom d'utilisateur est déjà utilisé" 
      });
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Format d'email invalide" 
      });
    }

    // Valider la force du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Le mot de passe doit contenir au moins 6 caractères" 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'employé avec role_id = 3 (employé)
    const employeeId = await User.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      username,
      role_id: 3, // Toujours 3 pour un employé
      cinema_id: cinema_id || null
    });

    res.status(201).json({ 
      message: "Employé créé avec succès",
      employeeId,
      credentials: {
        email,
        temporary_password: password // À communiquer à l'employé
      }
    });
  } catch (error) {
    console.error("Erreur création employé:", error);
    res.status(500).json({ message: "Erreur lors de la création de l'employé" });
  }
};



