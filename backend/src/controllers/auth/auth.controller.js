// src/controllers/auth/auth.controller.js
// Modifications :
// - login() vérifie maintenant tempPasswordExpiresAt : un mot de passe temporaire expiré
//   (au-delà de 24h) est refusé, avec invitation à repasser par "mot de passe oublié".


import User from "../../models/user.model.js";
import Role from "../../models/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateEmail } from "../../utils/validateEmail.js";
import { validatePassword } from "../../utils/validatePassword.js";
import { setTemporaryPasswordForUser } from "../../utils/setTemporaryPasswordForUser.js";

const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans les variables d'environnement");

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
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Un mot de passe temporaire expiré ne doit plus permettre la connexion : la personne
    // doit en redemander un nouveau plutôt que d'utiliser indéfiniment l'ancien.
    if (
      user.mustChangePassword &&
      user.tempPasswordExpiresAt &&
      new Date(user.tempPasswordExpiresAt) < new Date()
    ) {
      return res.status(401).json({
        message: "Votre mot de passe temporaire a expiré. Merci de faire une nouvelle demande de mot de passe oublié.",
        tempPasswordExpired: true,
      });
    }

    const userRole = user.roleDetails?.nom_role?.toUpperCase();

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: userRole
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.json({
      token,
      message: "Connexion réussie",
      user: {
        id: user.id,
        name: user.name || user.prenom || user.email,
        email: user.email,
        role_id: user.role_id,
        role: userRole,
        prenom: user.prenom,
        nom: user.nom,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error(err);
   res.status(500).json({
  message: "Erreur serveur",
  ...(process.env.NODE_ENV !== "production" && { detail: err.message })
});
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("auth_token",{
    httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", 
  });
  res.json({ message: "Déconnexion réussie" });
};

export const changeTempPassword = async (req, res) => {
 
    try {
    const { newPassword } = req.body;
    const userId = req.user?.id; // l'identifiant vient du jeton, jamais du corps de la requête

    if (!userId)
      return res.status(401).json({ message: "Authentification requise" });

    if (!newPassword)
      return res.status(400).json({ message: "Nouveau mot de passe requis" });

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
    user.tempPasswordExpiresAt = null; // nettoyage, le mot de passe n'est plus temporaire
    await user.save();

    res.status(200).json({ message: "Mot de passe changé avec succès" });
  } catch (err) {
   res.status(500).json({
  message: "Erreur serveur",
  ...(process.env.NODE_ENV !== "production" && { detail: err.message })
});
  }
};

// Mot de passe oublié (utilisateur/employé/admin) — consolidé sur setTemporaryPasswordForUser
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Si ce compte existe, un email a été envoyé." });

    await setTemporaryPasswordForUser(user);

    res.status(200).json({
      message: "Un mot de passe temporaire vous a été envoyé par email. Vous devriez le changer à la prochaine connexion."
    });
  } catch (err) {
    res.status(500).json({
  message: "Erreur serveur",
  ...(process.env.NODE_ENV !== "production" && { detail: err.message })
});
  }
};

// Mot de passe oublié (visiteur/client uniquement, réponse générique anti-énumération)
export const forgotPasswordVisitor = async (req, res) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "roleDetails" }]
    });
    const userRole = user?.roleDetails?.nom_role?.toUpperCase();

    if (!user || !['VISITEUR', 'CLIENT'].includes(userRole)) {
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

    const match = await bcrypt.compare(tempPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mot de passe temporaire invalide" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Mot de passe invalide : min 8 caractères, majuscule, minuscule, chiffre et caractère spécial"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    user.tempPasswordExpiresAt = null;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès !" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};