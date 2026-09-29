import nodemailer from "nodemailer";

// Envoie l'email de confirmation de compte (US 6 de l'énoncé).
// Le lien pointe directement vers l'API 

export const sendAccountConfirmation = async (email, confirmToken) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const confirmUrl = `${process.env.FRONTEND_URL}/auth/confirm/${confirmToken}`;

    const mailOptions = {
      from: `"Cinephoria" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Confirmez votre compte Cinephoria",
      html: `
        <p>Bonjour,</p>
        <p>Merci de vous être inscrit sur Cinephoria.</p>
        <p>Veuillez confirmer votre compte en cliquant sur le lien ci-dessous (valable 24h) :</p>
        <p><a href="${confirmUrl}">Confirmer mon compte</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Email de confirmation envoyé à ${email}`);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", err);
    throw new Error("Impossible d'envoyer l'email de confirmation");
  }
};