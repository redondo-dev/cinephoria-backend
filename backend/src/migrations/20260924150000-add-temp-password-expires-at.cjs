// migrations/xxxxxxxxxxxxxx-add-temp-password-expires-at.cjs


'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateur', 'temp_password_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('utilisateur', 'temp_password_expires_at');
  },
};
