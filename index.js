const { Client, Events, SlashCommandBuilder, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const Guild = require('./models/Guild');
const sequelize = require('./utils/database');
const { where } = require('sequelize');
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.username}.`);

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
    if (interaction.commandName === 'dict') {
        dbSync(interaction.guildId);
        let prohibitedWords = [];

        Guild.findByPk(interaction.guildId)
            .then((data) => {
                data.dataValues.data.map((word) => {
                    prohibitedWords.push(word);
                });
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
                if (data.dataValues.data !== null) {
                    data.dataValues.data.map((word) => {
                        if (data.dataValues.data.includes(input)) addWord = false;
                        currentData.push(word);
                    });
                }
            })
            .then(async () => {
                if (addWord) {
                    newData = [...currentData, input];
                    await Guild.update({ data: newData }, { where: { guildId: interaction.guildId } }).then(() => {
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

        Guild.findByPk(interaction.guildId)
            .then((data) => {
                data.dataValues.data.map((word) => {
                    newData.push(word);

                    newData = newData.filter((word) => {
                        return word !== input;
                    });
                });
            })
            .then(async () => {
                await Guild.update({ data: newData }, { where: { guildId: interaction.guildId } }).then(() => {
                    interaction.reply('The word has been removed from the dictionary.');
                });
            });
    }
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot || message.content.startsWith('/dict')) return;
    let currentData = [];

    Guild.findByPk(message.guildId)
        .then((data) => {
            data.dataValues.data.map((word) => {
                currentData.push(word);
            });
        })
        .then(async () => {
            currentData.forEach(async (word) => {
                if (message.content.toLowerCase().includes(word)) {
                    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        message.delete();
                        return;
                    }
                    await message.member
                        .timeout(30000, `Used the word(s) ${word}`)
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
