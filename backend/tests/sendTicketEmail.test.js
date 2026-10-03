// tests/sendTicketEmail.test.js
// Test unitaire de l'envoi du billet par email (US 4) : le billet doit partir par l'API HTTP de Brevo
// (expéditeur authentifié, comme les autres emails), et non par l'ancien SMTP bloqué par Render.

import { jest } from '@jest/globals';

// Mock ESM : à déclarer AVANT l'import dynamique du module testé
const mockSendEmailViaBrevo = jest.fn();

jest.unstable_mockModule('../src/utils/sendEmailViaBrevo.js', () => ({
  sendEmailViaBrevo: mockSendEmailViaBrevo,
}));

let sendTicketEmail;

beforeAll(async () => {
  ({ sendTicketEmail } = await import('../src/utils/sendEmailConfirmation.js'));
});

let logSpy;
let errorSpy;

beforeEach(() => {
  jest.resetAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSendEmailViaBrevo.mockResolvedValue(undefined);
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

const reservationComplete = {
  id: 335,
  nb_places: 2,
  prix_unitaire: '10.5',
  seance: {
    dateHeureDebut: '2026-12-27T17:00:00.000Z',
    film: { titre: 'Oppenheimer' },
    salle: { cinema: { nom: 'Cinéphoria Paris' } },
  },
  billets: [
    { siege: { rangee: 'A', numero_siege: 1 } },
    { siege: { rangee: 'A', numero_siege: 2 } },
  ],
};

describe('sendTicketEmail', () => {
  it('envoie le billet par l’API Brevo à l’adresse du client', async () => {
    await sendTicketEmail({ to: 'client@exemple.fr', reservation: reservationComplete });

    expect(mockSendEmailViaBrevo).toHaveBeenCalledTimes(1);
    const [destinataire, sujet, html] = mockSendEmailViaBrevo.mock.calls[0];
    expect(destinataire).toBe('client@exemple.fr');
    expect(sujet).toBe('🎬 Votre billet — Oppenheimer · Réf. #335');
    expect(html).toContain('Oppenheimer');
    expect(html).toContain('Cinéphoria Paris');
    expect(html).toContain('A1, A2');
    expect(html).toContain('21.00 €');
    expect(html).toContain('reservation-335');
  });

  it('journalise l’envoi réussi', async () => {
    await sendTicketEmail({ to: 'client@exemple.fr', reservation: reservationComplete });

    expect(logSpy).toHaveBeenCalledWith('Email billet envoyé à client@exemple.fr');
  });

  it('utilise des valeurs par défaut quand la séance et les billets sont absents', async () => {
    await sendTicketEmail({ to: 'client@exemple.fr', reservation: { id: 7, nb_places: 1, prix_unitaire: 9 } });

    const [, sujet, html] = mockSendEmailViaBrevo.mock.calls[0];
    expect(sujet).toBe('🎬 Votre billet — votre séance · Réf. #7');
    expect(html).toContain('N/A');
    expect(html).toContain('9.00 €');
  });

  it('signale une erreur claire si Brevo échoue, sans la masquer', async () => {
    mockSendEmailViaBrevo.mockRejectedValue(new Error('Brevo indisponible'));

    let erreur;
    try {
      await sendTicketEmail({ to: 'client@exemple.fr', reservation: reservationComplete });
    } catch (e) {
      erreur = e;
    }

    expect(erreur.message).toBe('Impossible d\'envoyer l\'email de billet');
    expect(errorSpy).toHaveBeenCalled();
  });
});