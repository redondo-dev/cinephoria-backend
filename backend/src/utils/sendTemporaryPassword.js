import { sendEmailViaBrevo } from "./sendEmailViaBrevo.js";

// Envoie le mot de passe temporaire (US 11 : mot de passe oublie, et
// creation de compte employe par un administrateur, US 8).
export const sendTemporaryPassword = async (email, tempPassword) => {
  try {
    const htmlContent = `
      <p>Bonjour,</p>
      <p>Votre mot de passe temporaire pour Cinephoria est : <b>${tempPassword}</b></p>
      <p>Vous devrez le changer a votre prochaine connexion.</p>
      <p><a href="${process.env.FRONTEND_URL}">Se connecter a Cinephoria</a></p>
    `;

    await sendEmailViaBrevo(email, "Votre mot de passe temporaire Cinephoria", htmlContent);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err);
    throw new Error("Impossible d'envoyer le mot de passe temporaire");
  }
};
