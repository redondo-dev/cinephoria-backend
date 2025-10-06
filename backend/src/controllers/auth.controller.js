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
      { expiresIn: "1h" }
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
