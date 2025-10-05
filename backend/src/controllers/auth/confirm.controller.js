import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";


 //Contrôleur pour confirmer un compte via un token envoyé par email
 
export const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token manquant" });
    }

    // Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupération de l’utilisateur lié au token
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifie si déjà confirmé
    if (user.isConfirmed) {
      return res.status(400).json({ message: "Compte déjà confirmé" });
    }

    // Confirmation du compte
    user.isConfirmed = true;
    await user.save();

    res.status(200).json({ message: "Compte confirmé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la confirmation", error: err.message });
  }
};
