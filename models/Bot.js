const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Bot = sequelize.define('Bot', {
    botId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    data: {
        type: Sequelize.JSON,
    },
});

module.exports = Bot;
