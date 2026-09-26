// src/controllers/contact/contact.controller.js


import { sendEmail } from "../../utils/emailContact.js";
import { validateEmail } from "../../utils/validateEmail.js";

export const postContact = async (req, res) => {
  try {
    const { nom, email, titre, description } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Email invalide ou manquant" });
    }
    if (!titre || !titre.trim()) {
      return res.status(400).json({ success: false, message: "Le titre de la demande est obligatoire" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "La description est obligatoire" });
    }

    await sendEmail({ nom, email, titre: titre.trim(), description: description.trim() });

    res.status(200).json({
      success: true,
      message: "Votre message a bien été envoyé."
    });
  } catch (error) {
    console.error("Erreur d'envoi du contact :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'envoi du message."
    });
  }
};