// tests/sendEmailViaBrevo.test.js
// Test unitaire de l'utilitaire d'envoi par l'API Brevo (aucun appel réseau : fetch est simulé).
// Il sert aussi de filet de sécurité pour les trois fonctions qui en dépendent
// (confirmation de compte, mot de passe temporaire, billet).

import { jest } from '@jest/globals';
import { sendEmailViaBrevo } from '../src/utils/sendEmailViaBrevo.js';

const fetchOriginal = globalThis.fetch;
const cleOriginale = process.env.BREVO_API_KEY;

let fetchMock;
let logSpy;

const reponseOk = (messageId = '<abc@brevo>') => ({
  ok: true,
  status: 201,
  json: async () => ({ messageId }),
  text: async () => '',
});

const corpsEnvoye = () => JSON.parse(fetchMock.mock.calls[0][1].body);

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
  fetchMock = jest.fn();
  fetchMock.mockResolvedValue(reponseOk());
  globalThis.fetch = fetchMock;
  process.env.BREVO_API_KEY = 'cle-de-test';
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  if (cleOriginale === undefined) {
    delete process.env.BREVO_API_KEY;
  } else {
    process.env.BREVO_API_KEY = cleOriginale;
  }
  logSpy.mockRestore();
});

describe('sendEmailViaBrevo', () => {
  it('envoie une requête POST authentifiée par la clé API à Brevo', async () => {
    await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requete] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(requete.method).toBe('POST');
    expect(requete.headers['api-key']).toBe('cle-de-test');
    expect(requete.headers['Content-Type']).toBe('application/json');
  });

  it('utilise l’expéditeur authentifié par défaut', async () => {
    await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>');

    const corps = corpsEnvoye();
    expect(corps.sender).toEqual({ name: 'Cinephoria', email: 'noreply@cinephoria-app.com' });
    expect(corps.to).toEqual([{ email: 'client@exemple.fr' }]);
    expect(corps.subject).toBe('Objet');
    expect(corps.htmlContent).toBe('<p>Bonjour</p>');
  });

  it('accepte un expéditeur et un nom personnalisés', async () => {
    await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>', 'equipe@exemple.fr', 'Équipe');

    expect(corpsEnvoye().sender).toEqual({ name: 'Équipe', email: 'equipe@exemple.fr' });
  });

  it('n’ajoute aucune adresse de réponse quand on n’en fournit pas (appels existants inchangés)', async () => {
    await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>');

    expect('replyTo' in corpsEnvoye()).toBe(false);
  });

  it('ne traite pas des options vides comme une adresse de réponse', async () => {
    await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>', undefined, 'Cinephoria', {});

    expect('replyTo' in corpsEnvoye()).toBe(false);
  });

  it('transmet l’adresse de réponse quand elle est fournie', async () => {
    await sendEmailViaBrevo('equipe@exemple.fr', 'Objet', '<p>Bonjour</p>', undefined, 'Cinephoria Contact', {
      replyTo: { email: 'visiteur@exemple.fr', name: 'Léa' },
    });

    expect(corpsEnvoye().replyTo).toEqual({ email: 'visiteur@exemple.fr', name: 'Léa' });
  });

  it('lève une erreur claire, sans appeler Brevo, si la clé API manque', async () => {
    delete process.env.BREVO_API_KEY;

    const erreur = await erreurDe(() => sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>'));

    expect(erreur === null).toBe(false);
    expect(erreur.message).toContain('BREVO_API_KEY');
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('lève une erreur avec le statut et le message quand Brevo refuse la requête', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'Key not found' });

    const erreur = await erreurDe(() => sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>'));

    expect(erreur.message).toContain('401');
    expect(erreur.message).toContain('Key not found');
  });

  it('renvoie la réponse de Brevo et journalise l’identifiant du message', async () => {
    const resultat = await sendEmailViaBrevo('client@exemple.fr', 'Objet', '<p>Bonjour</p>');

    expect(resultat).toEqual({ messageId: '<abc@brevo>' });
    expect(logSpy).toHaveBeenCalledWith('Email envoye via Brevo API a client@exemple.fr (messageId: <abc@brevo>)');
  });
});
