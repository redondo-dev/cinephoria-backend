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
                attributes: ['id', 'date_seance', 'heure_debut']
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
            hasSeance: !!reservation.seance
        });
        

        // 3. Créer les données pour le QR code
        const qrData = {
            type: 'CINEPHORIA_TICKET',
             reservationId: reservation.id,
            seanceId: reservation.seance_id,
            userId: reservation.utilisateur_id || userId, // ← Utilisez celui de la DB ou le test
            validationCode: generateValidationCode(),
            timestamp: new Date().toISOString(),
            seanceDate: reservation.seance?.date_seance,
        
        };
  console.log('📦 QR Data:', qrData);
        

        // 4. Générer le QR code
        let qrCodeBase64;
        try {
            qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
            console.log(' QR Code generated successfully');
        } catch (qrError) {
            console.error(' QR Code generation error:', qrError);
            // Fallback: utiliser un service externe
            const qrText = JSON.stringify(qrData);
            qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
        }

        // 5. Retourner la réponse
        res.status(200).json({
            success: true,
            qrCode: qrCodeBase64,
            qrData: qrData, // Pour debug frontend
            reservation: {
                id: reservation.id,
                reference: reservation.reference,
                dateReservation: reservation.date_reservation,
                nbPlaces: reservation.nbPlaces,
                montantTotal: reservation.montantTotal,
                statut: reservation.statut,
                film: reservation.seance?.film?.titre,
                cinema: reservation.seance?.salle?.cinema?.nom,
                dateSeance: reservation.seance?.date_seance,
                heureSeance: reservation.seance?.heure_debut,
                salle: reservation.seance?.salle?.nom
            }
        });

    } catch (error) {
        console.error('🔥 Erreur génération QR code:', error);
        console.error('Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la génération du QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Génère un code de validation unique
 */
function generateValidationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CINE-${code}`;
}