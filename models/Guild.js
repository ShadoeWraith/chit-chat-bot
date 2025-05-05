const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Guild = sequelize.define('Guild', {
    guildId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    data: {
        type: Sequelize.JSON,
    },
});

module.exports = Guild;
