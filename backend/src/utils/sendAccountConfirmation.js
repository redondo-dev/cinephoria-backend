import { sendEmailViaBrevo } from "./sendEmailViaBrevo.js";

// Envoie l'email de confirmation de compte (US 6 de l'enonce).
// Le lien pointe vers le frontend, qui appelle lui-meme l'API de
// confirmation (GET /api/auth/confirm/:token), deja geree par
// confirm.controller.js.
export const sendAccountConfirmation = async (email, confirmToken) => {
  try {
    const confirmUrl = `${process.env.FRONTEND_URL}/auth/confirm/${confirmToken}`;

    const htmlContent = `
      <p>Bonjour,</p>
      <p>Merci de vous etre inscrit sur Cinephoria.</p>
      <p>Veuillez confirmer votre compte en cliquant sur le lien ci-dessous (valable 24h) :</p>
      <p><a href="${confirmUrl}">Confirmer mon compte</a></p>
    `;

    await sendEmailViaBrevo(email, "Confirmez votre compte Cinephoria", htmlContent);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", err);
    throw new Error("Impossible d'envoyer l'email de confirmation");
  }
};