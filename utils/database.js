import Sequelize from 'sequelize';

export const sequelize = new Sequelize('database', 'user', 'password', {
    dialect: 'sqlite',
    host: 'localhost',

    storage: './db/database.sqlite',
    logging: false,
});
