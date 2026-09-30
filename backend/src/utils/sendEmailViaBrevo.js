// src/utils/sendEmailViaBrevo.js
//
// Envoie un email via l'API HTTP de Brevo, plutot que via SMTP.
// Necessaire car Render bloque les connexions SMTP sortantes sur tous les
// ports testes (587, 465, 2525) avec une erreur ETIMEDOUT. L'API HTTP,
// elle, n'est pas soumise a ce blocage.
//
// Necessite la variable d'environnement BREVO_API_KEY (a generer sur
// Brevo : Parametres > SMTP & API > onglet API, distincte de la cle SMTP).

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * @param {string} to - adresse email du destinataire
 * @param {string} subject - objet de l'email
 * @param {string} htmlContent - contenu HTML de l'email
 * @param {string} [fromEmail] - adresse expediteur (optionnel, sinon SMTP_USER)
 * @param {string} [fromName] - nom expediteur affiche (optionnel)
 */
export const sendEmailViaBrevo = async (to, subject, htmlContent, fromEmail, fromName = "Cinephoria") => {
  const senderEmail = fromEmail || process.env.SMTP_USER;

  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY manquante dans les variables d'environnement");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API a repondu ${response.status} : ${errorBody}`);
  }

  const result = await response.json();
  console.log(`Email envoye via Brevo API a ${to} (messageId: ${result.messageId})`);
  return result;
};