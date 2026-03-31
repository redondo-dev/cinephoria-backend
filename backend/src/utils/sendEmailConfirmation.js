//Envoi d'un email de confirmation après inscription
import nodemailer from "nodemailer";

export const sendConfirmationEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    });

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
