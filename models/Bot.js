import Sequelize from 'sequelize';
import { sequelize } from '../utils/database.js';

export const Bot = sequelize.define('Bot', {
    botId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    data: {
        type: Sequelize.JSON,
    },
});
