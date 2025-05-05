const { Client, Events, SlashCommandBuilder, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const ForbbidenWord = require('./models/ForbiddenWords');

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

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.commandName === 'dict') {
        let prohibitedWords = [];
        ForbbidenWord.findAll({ attributes: ['word'] })
            .then(async (data) => {
                for (let word of data) {
                    prohibitedWords.push(word.word.toLowerCase());
                }
            })
            .then(() => {
                const embed = new EmbedBuilder().setColor(0x0099ff).addFields({ name: 'List of prohibited words.', value: `${prohibitedWords.join('\n')}` });

                interaction.reply({ embeds: [embed] });
            });
    }

    if (interaction.commandName === 'dict-add') {
        await ForbbidenWord.findOrCreate({
            where: { word: interaction.options.getString('word').toLowerCase() },
        });
        interaction.reply('Word has been added to dictionary.');
    }

    if (interaction.commandName === 'dict-remove') {
        let prohibitedWords = [];
        ForbbidenWord.findAll({ attributes: ['word'] })
            .then(async (data) => {
                for (let word of data) {
                    prohibitedWords.push(word.word.toLowerCase());
                }
            })
            .then(async () => {
                if (prohibitedWords.length === 0) {
                    interaction.reply('There are no words to remove.');
                    return;
                } else if (!prohibitedWords.includes(interaction.options.getString('word').toLowerCase())) {
                    interaction.reply('That word does not exist. Use /dict to view the dictionary');
                    return;
                }

                await ForbbidenWord.destroy({
                    where: { word: interaction.options.getString('word').toLowerCase() },
                });
                interaction.reply('Word has been removed from the dictionary.');
            });
    }
});

client.on(Events.MessageCreate, (message) => {
    const interactionHandler =
        (Events.InteractionCreate,
        (interation) => {
            if (interaction.commandName === 'dict-remove') return;
        });
    if (PermissionFlagsBits.ManageChannels) {
        message.delete();
        return;
    }
    let prohibitedWords = [];
    ForbbidenWord.findAll({ attributes: ['word'] })
        .then(async (data) => {
            for (let word of data) {
                prohibitedWords.push(word.word.toLowerCase());
            }
        })
        .then(() => {
            prohibitedWords.forEach(async (word) => {
                if (message.content.toLowerCase().includes(word)) {
                    await message.member
                        .timeout(300000, `Used the word(s) ${word}`)
                        .then(() => {
                            message.channel.send(`${message.member} is timed out.`);
                        })
                        .catch((e) => console.log(e.rawError.message));
                    message.delete();
                }
            });
        });
});

client.login(process.env.BOT_TOKEN);
