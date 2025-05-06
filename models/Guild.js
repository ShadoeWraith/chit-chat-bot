import Sequelize from 'sequelize';
import { sequelize } from '../utils/database.js';

export const Guild = sequelize.define('Guild', {
    guildId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    data: {
        type: Sequelize.JSON,
    },
});
