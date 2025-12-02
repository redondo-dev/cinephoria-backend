import QRCode from 'qrcode';
import { Reservation, Seance } from '../../models/index.js';

/**
 * US14: Générer un QR code pour une réservation
 * GET /api/user/reservations/:id/qrcode
 */
export const getReservationQRCode = async (req, res) => {

    console.log('=== QR CODE CONTROLLER CALLED ===');
    console.log('Reservation ID:', req.params.id);
    console.log('Full URL:', req.originalUrl);
    console.log('Method:', req.method);
  try {
    const reservationId = parseInt(req.params.id);
    const userId = req.user.id; // Récupéré du middleware authenticate

    // 1. Vérifier que la réservation existe et appartient à l'utilisateur
    const reservation = await Reservation.findOne({
      where: {
        id: reservationId,
        utilisateur_id: userId
      },
      include: [{
        model: Seance,
        attributes: ['id', 'date_seance', 'heure_debut']
      }]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 2. Créer les données pour le QR code
    const qrData = {
      type: 'CINEPHORIA_TICKET',
      reservationId: reservation.id,
      seanceId: reservation.seance_id,
      userId: reservation.utilisateur_id,
      validationCode: generateValidationCode(),
      timestamp: new Date().toISOString(),
      seanceDate: reservation.Sean?.date_seance,
      seanceTime: reservation.Sean?.heure_debut
    };

    // 3. Générer le QR code en base64
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
       
        console.log('QR Code generated:', qrData);

    // 4. Retourner la réponse
    res.json({
      success: true,
      qrCode: qrCodeBase64,
      reservation: {
        id: reservation.id,
        seanceId: reservation.seance_id,
        date: reservation.date_reservation,
        seats: reservation.sieges,
        seance: reservation.Sean
      }
    });

  } catch (error) {
    console.error(' Erreur génération QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la génération du QR code'
    });
  }
};

/**
 * Génère un code de validation unique
 */
function generateValidationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}