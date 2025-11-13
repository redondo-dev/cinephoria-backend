// controllers/public/film.controller.js
import Film from '../../../models/film.model.js';
import Genre from '../../../models/genre.model.js';
import Seance from '../../../models/seance.model.js';
import Salle from '../../../models/salle.model.js'; 
import Cinema from '../../../models/cinema.model.js';
// Récupérer tous les films (route publique)
export const getAllFilmsPublic = async (req, res) => {
  try {
    const films = await Film.findAll({
      order: [["date_ajout", "DESC"]],
       include: [
        {
          model: Genre,
          as: "genre", // alias défini dans Film.belongsTo()
          attributes: ["id", "nom"] 
        },
    {
      model: Seance,
      as: 'seances',
      
    
      include: [
        {
          model: Salle,
          as: 'salle',
          
          include: [
            {
              model: Cinema,
              as: 'cinema',
            
              attributes: ['id', 'nom', 'ville']
            }
          ]
        }
      ]
    }
  ]
});
  if (!films || films.length === 0) {
      return res.status(200).json({
        films: [],
        total: 0
      });
    }
    res.status(200).json({
      films: films,
  total: films.length
    })

  } catch (error) {
    console.error("Erreur getAllFilmsPublic:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des films',
      error: error.message
    });
  }
};

// Récupérer un film par ID (route publique)
export const getFilmByIdPublic = async (req, res) => {
  try {
    const film = await Film.findByPk(req.params.id);
    
    if (!film) {
      return res.status(404).json({
        success: false,
        message: 'Film non trouvé'
      });
    }

    res.status(200).json(film);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du film',
      error: error.message
    });
  }
};