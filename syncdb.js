const Bot = require('./models/Bot');
const Guild = require('./models/Guild');

//Guild.sync({ force: true });
Guild.sync({ alter: true });

//Bot.sync({ force: true });
Bot.sync({ alter: true });
