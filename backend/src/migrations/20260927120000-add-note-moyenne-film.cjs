'use strict';


// moyenne d'un film sauvegardée (US10 : "La note du film
// sera une moyenne de toutes les notes déposées par les utilisateurs").

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('film', 'note_moyenne', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('film', 'nombre_avis', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('film', 'note_moyenne');
    await queryInterface.removeColumn('film', 'nombre_avis');
  },
};