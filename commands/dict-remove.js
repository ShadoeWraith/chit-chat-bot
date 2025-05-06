import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('dict-remove')
    .setDescription('Removes a word from the forbidden words dictionary.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) => option.setName('word').setDescription('Remove the word from the dictionary.').setRequired(true));

export async function execute(interaction) {
    let input = interaction.options.getString('word').toLowerCase();
    let removeWord = true;
    let newData = [];

    const record = await Guild.findByPk(interaction.guildId);

    try {
        if (record.data.forbiddenWords) {
            if (!record.data.forbiddenWords.includes(input)) removeWord = false;
            record.data.forbiddenWords.map((word) => {
                newData.push(word);

                newData = newData.filter((word) => {
                    return word !== input;
                });

                if (newData.includes(input)) removeWord = false;
            });
        }

        if (removeWord) {
            let updatedData = record.data;

            if (updatedData.forbiddenWords === undefined) updatedData = { ...updatedData, forbiddenWords: [...newData] };
            else updatedData.forbiddenWords = newData;

            await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                interaction.reply({ content: `**${input}** has been removed from the dictionary.`, flags: MessageFlags.Ephemeral });
            });
        } else {
            interaction.reply({ content: `**${input}** does not exist in the dictionary.`, flags: MessageFlags.Ephemeral });
        }
    } catch (error) {
        interaction.reply({ content: 'No words in the dictionary to remove.', flags: MessageFlags.Ephemeral });
    }
}
