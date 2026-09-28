import QRCode from 'qrcode';
import { Reservation, Seance } from '../../models/index.js';

/**
 * US14: Générer un QR code pour une réservation
 * GET /api/user/reservations/:id/qrcode
 */
export const getReservationQRCode = async (req, res) => {
    try {
        const reservationId = parseInt(req.params.id);
        const userId = req.user.id;

        const reservation = await Reservation.findOne({
            where: {
                id: reservationId,
                utilisateur_id: userId,
            },
            include: [{
                model: Seance,
                as: 'seance',
                attributes: ['id', 'date_seance', 'date_heure_debut', 'date_heure_fin']
            }]
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        const qrData = {
            type: 'CINEPHORIA_TICKET',
            reservationId: reservation.id,
            seanceId: reservation.seance_id,
            userId: reservation.utilisateur_id,
            validationCode: generateValidationCode(),
            timestamp: new Date().toISOString(),
            seanceDate: reservation.seance?.date_seance,
            seanceStartTime: reservation.seance?.date_heure_debut,
            seanceEndTime: reservation.seance?.date_heure_fin
        };

        let qrCodeBase64;
        try {
            qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
        } catch (qrError) {
            console.error('Erreur génération QR code, fallback service externe:', qrError);
            const qrText = JSON.stringify(qrData);
            qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
        }

        res.status(200).json({
            success: true,
            qrCode: qrCodeBase64,
            reservation: {
                id: reservation.id,
                userId: reservation.utilisateur_id,
                seanceId: reservation.seance_id,
                seats: reservation.nb_places || 1,
                amount: reservation.prix_unitaire || 0,
                status: reservation.statut_reservation || 'confirmée',
                reservationDate: reservation.date_creation,
                seance: {
                    date: reservation.seance?.date_seance,
                    startTime: reservation.seance?.date_heure_debut,
                    endTime: reservation.seance?.date_heure_fin
                }
            }
        });

    } catch (error) {
        console.error('Erreur génération QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la génération du QR code',
            error: error.message,
        });
    }
};

function generateValidationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CINE-${code}`;
}