import nodemailer from "nodemailer";



export const sendTemporaryPassword = async (email, tempPassword) => {
  try {
    // Création du transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true", // true pour port 465, false pour 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

// Contenu de l'email
    const mailOptions = {
      from: `"Cinephoria" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Votre mot de passe temporaire Cinephoria",
      html: `
        <p>Bonjour,</p>
        <p>Votre mot de passe temporaire pour Cinephoria est : <b>${tempPassword}</b></p>
        <p>Vous devrez le changer à votre prochaine connexion.</p>
        <p><a href="${process.env.FRONTEND_URL}">Se connecter à Cinephoria</a></p>
      `
    };
 // Envoi de l'email
    await transporter.sendMail(mailOptions);

    console.log(`Email temporaire envoyé à ${email}`);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err);
    throw new Error("Impossible d'envoyer le mot de passe temporaire");
  }
};