import User from "../../models/user.model.js";
import Role from "../../models/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto'; 

import { sendTemporaryPassword } from "../../utils/sendTemporaryPassword.js";
import { setTemporaryPasswordForUser } from "../../utils/setTemporaryPasswordForUser.js";
import { validatePassword } from "../../utils/validatePassword.js";


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "roleDetails" }],
    });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
  
    console.log("Role :", user.roleDetails?.nom_role);

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Générer le JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: user.roleDetails?.nom_role,
      },
      JWT_SECRET,
      { expiresIn: "5h" }
    );

    // Cookie HttpOnly
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: user.roleDetails?.nom_role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Déconnexion réussie" });
};

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


export const forgotPasswordVisitor = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    const user = await User.findOne({ where: { email } });

    // Toujours répondre de façon générique pour éviter l'énumération d'emails
    if (!user || user.role !== 'visiteur') {
      return res.status(200).json({
        success: true,
        message: "Si ce compte existe, vous recevrez un mail contenant un mot de passe temporaire."
      });
    }

    await setTemporaryPasswordForUser(user, { expiresInHours: 24 });

    return res.status(200).json({
      success: true,
      message: "Si ce compte existe, vous recevrez un mail contenant un mot de passe temporaire."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({ message: "Email, mot de passe temporaire et nouveau mot de passe requis" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Vérifier le mot de passe temporaire
    const match = await bcrypt.compare(tempPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mot de passe temporaire invalide" });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false; 
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès !" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};