import User from "../../models/user.model.js";
import { validatePassword } from "../../utils/validatePassword.js";
import { validateEmail } from "../../utils/validateEmail.js";
import * as jwt from "jsonwebtoken";
import { sendTemporaryPassword } from "../../utils/sendTemporaryPassword.js";
import crypto from "crypto";
import * as bcrypt from "bcrypt";

// Création d'un compte normal (visiteur/client/utilisateur)
export const register = async (req, res) => {
  try {
    const { email, password, prenom, nom, username, role_id } = req.body;

    if (!email || !password || !prenom || !nom || !username) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Email invalide" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Mot de passe invalide : min 8 caractères, majuscule, minuscule, chiffre et caractère spécial",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé" });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername)
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur déjà utilisé" });

    //Hashage du mot de passe avant création de l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);

    const validRoles = [1, 2, 3, 4]; // liste des rôles valides

    if (role_id && !validRoles.includes(role_id)) {
      return res.status(400).json({ message: "Role invalide" });
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      username,
      role_id: role_id || 4, // Par défaut visiteur
      isConfirmed: false,
      mustChangePassword: false,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role_id: user.role_id,
        isConfirmed: user.isConfirmed,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Création compte avec mot de passe temporaire (force changement à la prochaine connexion)
export const registerWithTempPassword = async (req, res) => {
  try {
    const { email, prenom, nom, username, role_id } = req.body;

    if (!email || !prenom || !nom || !username) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé" });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername)
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur déjà utilisé" });

    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 caractères
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      username,
      role_id: role_id || 4, // Par défaut visiteur
      isConfirmed: true,
      mustChangePassword: true,
    });

    await sendTemporaryPassword(email, tempPassword);

    res.status(201).json({
      message:
        "Compte créé avec mot de passe temporaire. L'utilisateur doit le changer à la prochaine connexion",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role_id: user.role_id,
        isConfirmed: user.isConfirmed,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
