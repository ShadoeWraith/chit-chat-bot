import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
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
    let addWord = true;

    const record = await Guild.findByPk(interaction.guildId);

    if (record.data.forbiddenWords) {
        record.data.forbiddenWords.map((word) => {
            if (word === input) {
                addRole = false;
            }
        });
    }

    if (addWord) {
        let updatedData = record.data;

        if (updatedData.forbiddenWords === undefined) updatedData = { ...updatedData, forbiddenWords: [input] };
        else updatedData.forbiddenWords.push(input);

        await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
            interaction.reply({ content: `**${input}** has been added to dictionary.`, flags: MessageFlags.Ephemeral });
        });
    } else {
        interaction.reply({ content: `**${input}** already exists in the dictionary.`, flags: MessageFlags.Ephemeral });
    }
}
