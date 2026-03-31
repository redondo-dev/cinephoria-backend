import nodemailer from "nodemailer";

export const sendEmail = async ({ nom, titre, description }) => {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const to = process.env.CONTACT_EMAIL || "contact@cinephoria.fr";

  await transporter.sendMail({
   from: `"Cinephoria Contact" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL, 
    subject: `[Contact] ${titre}`,
    text: `Nom : ${nom || 'Anonyme'}\n\nMessage : ${description}`
  });
};
