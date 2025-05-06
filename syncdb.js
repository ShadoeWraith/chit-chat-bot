import { Bot } from './models/Bot.js';
import { Guild } from './models/Guild.js';

//Guild.sync({ force: true });
Guild.sync({ alter: true });

//Bot.sync({ force: true });
Bot.sync({ alter: true });
