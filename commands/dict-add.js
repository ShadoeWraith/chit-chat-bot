import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('dict-add')
    .setDescription('Adds a word to the forbidden words dictionary.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) => option.setName('word').setDescription('Add the word you want to forbid.').setRequired(true));

export async function execute(interaction) {
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
