const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const ForbbidenWord = sequelize.define('forbiddenWord', {
    word: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

module.exports = ForbbidenWord;
