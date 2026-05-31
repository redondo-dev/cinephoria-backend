//Envoi d'un email de confirmation après inscription
import nodemailer from "nodemailer";

//  fonction partagée
const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});

// Fonction — confirmation inscription
export const sendConfirmationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();

    const confirmationLink = `${process.env.FRONTEND_URL}/confirm/${token}`;

    const mailOptions = {
      from: `"Cinephoria" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Confirmez votre compte Cinephoria",
      html: `
        <p>Bonjour,</p>
        <p>Merci d'être inscrit sur Cinephoria !</p>
        <p>Veuillez confirmer votre compte en cliquant sur le lien suivant :</p>
        <p><a href="${confirmationLink}">Confirmer mon compte</a></p>
        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmation envoyé à ${email}`);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", err);
    throw new Error("Impossible d'envoyer l'email de confirmation");
  }
};

// ── 2. Email billet de réservation ───────────────────
export const sendTicketEmail = async ({ to, reservation }) => {
  try {
    const transporter = createTransporter();
    const { id, nb_places, prix_unitaire, seance, siegesReserves } = reservation;

    const total = (nb_places * prix_unitaire).toFixed(2);
    const sieges = siegesReserves?.map(s => `${s.rangee}${s.numero_siege}`).join(', ') || 'N/A';
    const dateSeance = seance?.dateHeureDebut
      ? new Date(seance.dateHeureDebut).toLocaleString('fr-FR')
      : 'N/A';

    await transporter.sendMail({
      from: `"Cinephoria" <${process.env.SMTP_USER}>`,
      to,
      subject: `🎬 Votre billet — ${seance?.film?.titre} · Réf. #${id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <div style="background: #1a1a2e; padding: 28px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎬 CINÉPHORIA</h1>
            <p style="color: #a0a0c0; margin: 8px 0 0;">Votre billet de cinéma</p>
          </div>

          <div style="padding: 28px; background: white;">
            <h2 style="color: #1a1a2e;">Réservation confirmée ! ✓</h2>
            <p style="color: #888;">Référence : <strong style="color: #635bff;">#${id}</strong></p>

            <table style="width: 100%; border-collapse: collapse; background: #f7f7fb; border-radius: 8px; padding: 16px;">
              <tr><td style="padding: 8px; color: #888;">🎬 Film</td>      <td style="padding: 8px; font-weight: 600;">${seance?.film?.titre || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">🏛️ Cinéma</td>   <td style="padding: 8px; font-weight: 600;">${seance?.salle?.cinema?.nom || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">📅 Séance</td>    <td style="padding: 8px; font-weight: 600;">${dateSeance}</td></tr>
              <tr><td style="padding: 8px; color: #888;">💺 Sièges</td>    <td style="padding: 8px; font-weight: 600;">${sieges}</td></tr>
              <tr><td style="padding: 8px; color: #888;">🎟️ Places</td>   <td style="padding: 8px; font-weight: 600;">${nb_places}</td></tr>
              <tr style="border-top: 2px solid #e0e0ec;">
                <td style="padding: 12px 8px; font-weight: 700;">💳 Total</td>
                <td style="padding: 12px 8px; font-weight: 700; color: #635bff; font-size: 18px;">${total} €</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 24px 0;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?data=reservation-${id}&size=160x160"
                   alt="QR Code" style="border-radius: 8px; border: 1px solid #e0e0ec;" />
              <p style="color: #aaa; font-size: 12px;">Présentez ce QR code à l'entrée</p>
            </div>

            <p style="color: #888; font-size: 12px; text-align: center;">
              Billet personnel et non remboursable.<br>
              Support : <a href="mailto:support@cinephoria.fr" style="color: #635bff;">support@cinephoria.fr</a>
            </p>
          </div>

          <div style="background: #1a1a2e; padding: 16px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">© 2026 Cinéphoria</p>
          </div>
        </div>
      `
    });

    console.log(`Email billet envoyé à ${to}`);
  } catch (err) {
    console.error("Erreur envoi email billet :", err);
    throw new Error("Impossible d'envoyer l'email de billet");
  }
};