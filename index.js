const { Client, Events, SlashCommandBuilder, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { formatDistance } = require('date-fns');
const dotenv = require('dotenv');
const Guild = require('./models/Guild');
const Bot = require('./models/Bot');
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

let botId = '';

client.once(Events.ClientReady, (c) => {
    const date = new Date();
    console.log(`Logged in as ${c.user.username}.`);

    botId = c.user.id;

    Bot.findOrCreate({ where: { botId: c.user.id } })
        .catch((e) => {
            console.log('Unable to write to DB - BOT');
        })
        .then(() => {
            Bot.findByPk(c.user.id)
                .then(async (data) => {
                    await Bot.update({ data: { uptime: { date } } }, { where: { botId: c.user.id } }).catch((e) => {
                        console.log(e);
                    });
                })
                .catch((e) => {
                    console.log(e);
                });
        });

    const uptime = new SlashCommandBuilder().setName('uptime').setDescription('Displays the uptime of the bot.');

    const viewDict = new SlashCommandBuilder().setName('dict').setDescription('Displays all the forbidden words in the dictionary.').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

    const addToDict = new SlashCommandBuilder()
        .setName('dict-add')
        .setDescription('Adds a word to the forbidden words dictionary.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((option) => option.setName('word').setDescription('Add the word you want to forbid.').setRequired(true));

    const removeFromDict = new SlashCommandBuilder()
        .setName('dict-remove')
        .setDescription('Removes a word from the forbidden words dictionary.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((option) => option.setName('word').setDescription('Remove the word from the dictionary.').setRequired(true));

    client.application.commands.create(uptime);
    client.application.commands.create(viewDict);
    client.application.commands.create(addToDict);
    client.application.commands.create(removeFromDict);
});

client.on('guildCreate', (guild) => {
    Guild.findOrCreate({ where: { guildId: guild.id } }).catch((e) => {
        console.log('Unable to write to DB');
    });
    console.log(`Joined guild: ${guild.name} (${guild.id})`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.commandName === 'uptime') {
        dbSync(interaction.guildId);
        let currentDate = new Date();
        Bot.findByPk(botId)
            .then(async (data) => {
                let uptime = data.dataValues.data?.uptime;
                const timeAgo = formatDistance(uptime.date, currentDate, { addSuffix: true });

                const embed = new EmbedBuilder().setColor('#0099ff').setTitle('Uptime').setDescription(`:clock1: ${timeAgo}`).setTimestamp();
                interaction.reply({ embeds: [embed] });
            })
            .catch((e) => {
                console.log(e);
            });
    }

    if (interaction.commandName === 'dict') {
        dbSync(interaction.guildId);
        let prohibitedWords = [];

        Guild.findByPk(interaction.guildId)
            .then((data) => {
                let values = data.dataValues.data?.forbiddenWords;
                if (values !== null && values !== undefined) {
                    values.map((word) => {
                        prohibitedWords.push(word);
                    });
                }
            })
            .then(() => {
                const embed = new EmbedBuilder().setColor(0x0099ff).addFields({
                    name: 'List of prohibited words.',
                    value: `${prohibitedWords.length > 0 ? prohibitedWords.join('\n') : 'No words in the dictionary.'}`,
                });

                interaction.reply({ embeds: [embed] });
            })
            .catch((e) => {
                const embed = new EmbedBuilder().setColor(0x0099ff).addFields({
                    name: 'List of prohibited words.',
                    value: 'No words in the dictionary.',
                });

                interaction.reply({ embeds: [embed] });
            });
    }

    if (interaction.commandName === 'dict-add') {
        dbSync(interaction.guildId);
        let input = interaction.options.getString('word').toLowerCase();
        let currentData = [];
        let newData = [];
        let addWord = true;

        Guild.findByPk(interaction.guildId)
            .then((data) => {
                let values = data.dataValues.data?.forbiddenWords;
                if (values !== null && values !== undefined) {
                    values.map((word) => {
                        if (values.includes(input)) addWord = false;
                        currentData.push(word);
                    });
                }
            })
            .then(async () => {
                if (addWord) {
                    newData = [...currentData, input];
                    await Guild.update({ data: { forbiddenWords: newData } }, { where: { guildId: interaction.guildId } }).then(() => {
                        interaction.reply('The word has been added to dictionary.');
                    });
                } else {
                    interaction.reply('The word already exists in the dictionary.');
                }
            });
    }

    if (interaction.commandName === 'dict-remove') {
        dbSync(interaction.guildId);
        let input = interaction.options.getString('word').toLowerCase();
        let newData = [];

        Guild.findByPk(interaction.guildId).then(async (data) => {
            let removeWord = true;
            let values = data.dataValues.data?.forbiddenWords;
            if (values !== null && values !== undefined) {
                values.map((word) => {
                    newData.push(word);

                    newData = newData.filter((word) => {
                        return word !== input;
                    });

                    if (values.includes(input)) {
                        return;
                    } else {
                        removeWord = false;
                    }
                });
                if (removeWord) {
                    await Guild.update({ data: newData }, { where: { guildId: interaction.guildId } }).then(() => {
                        interaction.reply('The word has been removed from the dictionary.');
                    });
                } else {
                    interaction.reply('The word you want to remove does not exist in the dictionary.');
                }
            } else {
                interaction.reply('No words in the dictionary to remove.');
                return;
            }
        });
    }
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot || message.content.startsWith('/dict') || message.content.startsWith('/uptime')) return;
    let currentData = [];

    Guild.findByPk(message.guildId)
        .then((data) => {
            let values = data.dataValues.data?.forbiddenWords;
            if (values !== null && values !== undefined) {
                values.map((word) => {
                    currentData.push(word);
                });
            }
        })
        .then(async () => {
            currentData.forEach(async (word) => {
                if (message.content.toLowerCase().includes(word)) {
                    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        message.delete();
                        return;
                    }
                    await message.member
                        .timeout(300000, `Used the word(s) ${word}`)
                        .then(() => {
                            message.channel.send(`${message.member} Stop right there criminal scum. You violated the law. You've been timed out.`);
                        })
                        .catch((e) => console.log(e.rawError.message));
                    message.delete();
                }
            });
        });
});

const dbSync = (guildId) => {
    Guild.findByPk(guildId).then(() => {
        Guild.findOrCreate({ where: { guildId: guildId } });
    });
};

client.login(process.env.BOT_TOKEN);
