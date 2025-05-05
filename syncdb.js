const Guild = require('./models/Guild');

//Guild.sync({ force: true });
Guild.sync({ alter: true });
