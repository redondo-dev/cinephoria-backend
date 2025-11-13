import { sendEmail } from "../../utils/emailContact.js";


export const postContact = async (req, res) => {
  try {
    const { nom,email, titre, description } = req.body;

    const message = `
       Nouveau message reçu depuis le site Cinéphoria
      
       Nom : ${nom || "Anonyme"}
      Email : ${email}
       Sujet : ${titre || "Sans titre"}
       Message :
      ${description || "Aucun message fourni"}
    `;

    await sendEmail({
    nom,email, titre, description
    });

    res.status(200).json({
      success: true,
      message: "Votre message a bien été envoyé."
    });
  } catch (error) {
    console.error("Erreur d’envoi du contact :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l’envoi du message."
    });
  }
};
