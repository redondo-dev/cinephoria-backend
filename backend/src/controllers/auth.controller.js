import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    const user = await User.findOne({ where: { email } ,
       include: [{ model: Role, as: "roleDetails" }]});
      console.log(user.roleDetails.nom_role);

     if (!user) return res.status(401).json({ message: "Utilisateur non trouvé" });
    // Vérif email ET password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }
  

    // Générer un JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Stocker le JWT dans un cookie HttpOnly
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1h
    });

    res.json({ message: "Connexion réussie" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Déconnexion réussie" });
};
