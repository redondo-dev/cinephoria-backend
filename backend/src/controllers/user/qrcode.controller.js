import QRCode from 'qrcode';
import { Reservation, Seance, Film, Cinema, Salle } from '../../models/index.js';

/**
 * US14: Générer un QR code pour une réservation
 * GET /api/user/reservations/:id/qrcode
 */
export const getReservationQRCode = async (req, res) => {
    console.log('=== QR CODE CONTROLLER CALLED ===');
    console.log('Reservation ID:', req.params.id);
   
    try {
        const reservationId = parseInt(req.params.id);
        
        // TEMPORAIRE : Pour testing sans auth
        const userId = req.user ? req.user.id : 1;
        
       console.log('User ID (temporary):', userId);

        // 1. Vérifier que la réservation existe avec toutes les infos nécessaires
        const reservation = await Reservation.findOne({
            where: { id: reservationId },
            // // TEMPORAIRE : Enlevez la condition utilisateur pour testing
             where: { 
                 id: reservationId,
            //     utilisateur_id: userId 
             },
         
                 include: [{
                model: Seance,
                as: 'seance', // ← Utilisez le bon alias
                attributes: ['id', 'date_seance', 'date_heure_debut,date_heure_fin']
            }]
        });
                            
        if (!reservation) {
            console.log(' Reservation not found for ID:', reservationId);
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        console.log(' Reservation found:', 
            {
            id: reservation.id,
            seanceId: reservation.seance_id,
            hasSeance: !!reservation.seance,
             seanceDate: reservation.seance?.date_seance,
            seanceTime: reservation.seance?.date_heure_debut
        });
        

        // 3. Créer les données pour le QR code
        const qrData = {
            type: 'CINEPHORIA_TICKET',
             reservationId: reservation.id,
            seanceId: reservation.seance_id,
            userId: reservation.utilisateur_id || userId, 
            validationCode: generateValidationCode(),
            timestamp: new Date().toISOString(),
           seanceDate: reservation.seance?.date_seance,
            seanceStartTime: reservation.seance?.date_heure_debut,
            seanceEndTime: reservation.seance?.date_heure_fin
        };
  console.log('📦 QR Data:', qrData);
        

    // 3. Générer le QR code en base64
        let qrCodeBase64;
        try {
            qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
            console.log('QR Code generated successfully');
        } catch (qrError) {
            console.error('QR Code generation failed, using external service:', qrError);
            // Fallback vers service externe
            const qrText = JSON.stringify(qrData);
            qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
        }

        // 4. Retourner la réponse
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
            },
            debug: {
                 note: 'Colonne correcte: date_heure_debut au lieu de heure_debut'
            }
        });

    } catch (error) {
        console.error(' Erreur génération QR code:', error);
        console.error('Error details:', {
            name: error.name,
            sql: error.sql,
            parent: error.parent?.message
        });
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la génération du QR code',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
     return `CINE-${code}`;
}     