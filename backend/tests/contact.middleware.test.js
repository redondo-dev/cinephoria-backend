// tests/contact.middleware.test.js
// Test de la validation du formulaire de contact (US 12), sur une mini application Express
// qui reproduit la lecture des corps de requête de app.js.

import express from 'express';
import request from 'supertest';
import { validateContact } from '../src/middleware/contact.middleware.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/contact/send', validateContact, (req, res) => {
  res.status(200).json({ recu: req.body });
});

const messageValide = {
  nom: 'Léa',
  email: 'visiteur@exemple.fr',
  titre: 'Horaires du cinéma',
  description: 'Bonjour, quels sont vos horaires ?',
};

const envoyer = (corps) => request(app).post('/contact/send').send(corps);

describe('validateContact', () => {
  it('accepte un message valide et le renvoie nettoyé (espaces retirés, email en minuscules)', async () => {
    const reponse = await envoyer({
      nom: '  Léa  ',
      email: ' Visiteur@Exemple.FR ',
      titre: '  Horaires du cinéma  ',
      description: '  Bonjour, quels sont vos horaires ?  ',
    });

    expect(reponse.status).toBe(200);
    expect(reponse.body.recu).toEqual(messageValide);
  });

  it('accepte un message sans nom', async () => {
    const { nom, ...sansNom } = messageValide;

    const reponse = await envoyer(sansNom);

    expect(reponse.status).toBe(200);
  });

  it('ne transforme pas les caractères spéciaux (l’échappement se fait à l’envoi de l’email)', async () => {
    const description = 'Je pense à toi <3 et à a & b > c, merci';

    const reponse = await envoyer({ ...messageValide, description });

    expect(reponse.status).toBe(200);
    expect(reponse.body.recu.description).toBe(description);
  });

  it('refuse un envoi sous forme de formulaire HTML (415)', async () => {
    const reponse = await request(app).post('/contact/send').type('form').send(messageValide);

    expect(reponse.status).toBe(415);
    expect(reponse.body.success).toBe(false);
  });

  it('refuse un titre qui n’est pas un texte, avec un 400 et non un 500', async () => {
    const reponse = await envoyer({ ...messageValide, titre: { a: 1 } });

    expect(reponse.status).toBe(400);
    expect(reponse.body.errors).toContain('Le titre doit être une chaîne de caractères.');
  });

  it('refuse une description qui n’est pas un texte, avec un 400 et non un 500', async () => {
    const reponse = await envoyer({ ...messageValide, description: 12345678901 });

    expect(reponse.status).toBe(400);
    expect(reponse.body.errors).toContain('La description doit être une chaîne de caractères.');
  });

  it('refuse un email qui n’est pas un texte', async () => {
    const reponse = await envoyer({ ...messageValide, email: { a: 1 } });

    expect(reponse.status).toBe(400);
    expect(reponse.body.errors).toContain('L\'email doit être une chaîne de caractères.');
  });

  it('refuse un email invalide ou absent', async () => {
    const invalide = await envoyer({ ...messageValide, email: 'pas-un-email' });
    const { email, ...sansEmail } = messageValide;
    const absent = await envoyer(sansEmail);

    expect(invalide.status).toBe(400);
    expect(invalide.body.errors).toContain('Email invalide');
    expect(absent.status).toBe(400);
    expect(absent.body.errors).toContain('L\'email est obligatoire');
  });

  it('refuse un titre ou une description absents', async () => {
    const reponse = await envoyer({ email: 'visiteur@exemple.fr' });

    expect(reponse.status).toBe(400);
    expect(reponse.body.errors).toContain('Le titre est obligatoire.');
    expect(reponse.body.errors).toContain('La description est obligatoire.');
  });

  it('refuse un titre trop court, une description trop courte et un nom trop long', async () => {
    const titre = await envoyer({ ...messageValide, titre: 'abc' });
    const description = await envoyer({ ...messageValide, description: 'court' });
    const nom = await envoyer({ ...messageValide, nom: 'x'.repeat(51) });

    expect(titre.status).toBe(400);
    expect(description.status).toBe(400);
    expect(nom.status).toBe(400);
  });

  it('refuse un titre composé uniquement d’espaces', async () => {
    const reponse = await envoyer({ ...messageValide, titre: '          ' });

    expect(reponse.status).toBe(400);
  });
});
