// tests/emailContact.test.js
// Test unitaire de l'envoi du formulaire de contact (US 12) : message transmis à l'adresse
// générique de Cinéphoria par l'API Brevo, avec le texte du visiteur neutralisé.

import { jest } from '@jest/globals';

// Mock ESM : à déclarer AVANT l'import dynamique du module testé
const mockSendEmailViaBrevo = jest.fn();

jest.unstable_mockModule('../src/utils/sendEmailViaBrevo.js', () => ({
  sendEmailViaBrevo: mockSendEmailViaBrevo,
}));

let sendEmail;
let echapperHtml;

beforeAll(async () => {
  ({ sendEmail, echapperHtml } = await import('../src/utils/emailContact.js'));
});

const destinataireOriginal = process.env.CONTACT_EMAIL;

const erreurDe = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
};

beforeEach(() => {
  jest.resetAllMocks();
  mockSendEmailViaBrevo.mockResolvedValue(undefined);
  process.env.CONTACT_EMAIL = 'equipe@exemple.fr';
});

afterEach(() => {
  if (destinataireOriginal === undefined) {
    delete process.env.CONTACT_EMAIL;
  } else {
    process.env.CONTACT_EMAIL = destinataireOriginal;
  }
});

const demande = {
  nom: 'Léa',
  email: 'visiteur@exemple.fr',
  titre: 'Horaires',
  description: 'Bonjour, quels sont vos horaires ?',
};

describe('echapperHtml', () => {
  it('neutralise les caractères qui ouvrent une balise ou un attribut', () => {
    expect(echapperHtml('<b>"a" & \'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  });

  it('renvoie une chaîne vide pour une valeur absente', () => {
    expect(echapperHtml(undefined)).toBe('');
    expect(echapperHtml(null)).toBe('');
  });
});

describe('sendEmail (contact)', () => {
  it('envoie le message à l’adresse générique configurée', async () => {
    await sendEmail(demande);

    expect(mockSendEmailViaBrevo).toHaveBeenCalledTimes(1);
    const [destinataire, sujet, html] = mockSendEmailViaBrevo.mock.calls[0];
    expect(destinataire).toBe('equipe@exemple.fr');
    expect(sujet).toBe('[Contact] Horaires');
    expect(html).toContain('Léa');
    expect(html).toContain('visiteur@exemple.fr');
    expect(html).toContain('Horaires');
    expect(html).toContain('quels sont vos horaires');
  });

  it('utilise l’expéditeur authentifié par défaut et ajoute l’adresse du visiteur en réponse', async () => {
    await sendEmail(demande);

    const [, , , expediteur, nomExpediteur, options] = mockSendEmailViaBrevo.mock.calls[0];
    expect(expediteur).toBe(undefined);
    expect(nomExpediteur).toBe('Cinephoria Contact');
    expect(options).toEqual({ replyTo: { email: 'visiteur@exemple.fr', name: 'Léa' } });
  });

  it('neutralise le HTML saisi par le visiteur', async () => {
    await sendEmail({
      ...demande,
      nom: '<img src=x onerror=alert(1)>',
      description: '<script>alert(1)</script>',
    });

    const html = mockSendEmailViaBrevo.mock.calls[0][2];
    expect(html.includes('<script>')).toBe(false);
    expect(html.includes('<img')).toBe(false);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('conserve les retours à la ligne du message', async () => {
    await sendEmail({ ...demande, description: 'ligne 1\nligne 2\r\nligne 3' });

    expect(mockSendEmailViaBrevo.mock.calls[0][2]).toContain('ligne 1<br>ligne 2<br>ligne 3');
  });

  it('retire les retours à la ligne de l’objet', async () => {
    await sendEmail({ ...demande, titre: 'Sujet\r\nBcc: pirate@exemple.fr' });

    expect(mockSendEmailViaBrevo.mock.calls[0][1]).toBe('[Contact] Sujet Bcc: pirate@exemple.fr');
  });

  it('signe « Anonyme » sans nom et n’ajoute pas d’adresse de réponse sans email', async () => {
    await sendEmail({ titre: 'Question', description: 'Bonjour' });

    const [, , html, , , options] = mockSendEmailViaBrevo.mock.calls[0];
    expect(html).toContain('Anonyme');
    expect(html).toContain('non renseigné');
    expect(options).toEqual({});
  });

  it('refuse d’envoyer si l’adresse de l’équipe n’est pas configurée', async () => {
    delete process.env.CONTACT_EMAIL;

    const erreur = await erreurDe(() => sendEmail(demande));

    expect(erreur === null).toBe(false);
    expect(erreur.message).toContain('CONTACT_EMAIL');
    expect(mockSendEmailViaBrevo).toHaveBeenCalledTimes(0);
  });

  it('laisse remonter une erreur de Brevo, pour que le contrôleur réponde 500', async () => {
    mockSendEmailViaBrevo.mockRejectedValue(new Error('Brevo indisponible'));

    const erreur = await erreurDe(() => sendEmail(demande));

    expect(erreur.message).toBe('Brevo indisponible');
  });
});
