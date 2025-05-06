import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('dict-remove')
    .setDescription('Removes a word from the forbidden words dictionary.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) => option.setName('word').setDescription('Remove the word from the dictionary.').setRequired(true));

export async function execute(interaction) {
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
