// src/utils/emailContact.js
// Envoi du message du formulaire de contact (US 12) a l'adresse generique de Cinephoria,
// via l'API HTTP de Brevo (Render bloque le SMTP).
// Le destinataire est fixe cote serveur (CONTACT_EMAIL) : le formulaire ne peut pas servir
// a envoyer du courrier a un tiers.

import { sendEmailViaBrevo } from "./sendEmailViaBrevo.js";

// Les textes saisis par le visiteur sont inseres dans un email HTML : on neutralise les balises,
// pour qu'un message ne puisse pas injecter de contenu dans la boite de l'equipe.
export const echapperHtml = (texte) =>
  String(texte ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendEmail = async ({ nom, email, titre, description }) => {
  const destinataire = process.env.CONTACT_EMAIL;
  if (!destinataire) {
    throw new Error("CONTACT_EMAIL manquante dans les variables d'environnement");
  }

  const nomSaisi = nom && String(nom).trim() ? String(nom).trim() : "";
  const sujet = `[Contact] ${String(titre).replace(/[\r\n]+/g, " ")}`;

  const html = `
    <p><strong>Nom :</strong> ${echapperHtml(nomSaisi || "Anonyme")}</p>
    <p><strong>Email :</strong> ${email ? echapperHtml(email) : "non renseigné"}</p>
    <p><strong>Titre :</strong> ${echapperHtml(titre)}</p>
    <p><strong>Message :</strong></p>
    <p>${echapperHtml(description).replace(/\r?\n/g, "<br>")}</p>
  `;

  // Avec une adresse, l'equipe peut repondre directement au visiteur depuis sa messagerie
  const options = email ? { replyTo: { email, name: nomSaisi || undefined } } : {};

  await sendEmailViaBrevo(destinataire, sujet, html, undefined, "Cinephoria Contact", options);
};