import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder().setName('dict').setDescription('Displays all the forbidden words in the dictionary.').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
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

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        })
        .catch((e) => {
            const embed = new EmbedBuilder().setColor(0x0099ff).addFields({
                name: 'List of prohibited words.',
                value: 'No words in the dictionary.',
            });

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        });
}
