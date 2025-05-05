const forbbidenWord = require('./models/ForbiddenWords');

forbbidenWord.sync({ alter: true });
//forbbidenWord.sync({ force: true });
