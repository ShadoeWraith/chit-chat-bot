import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder().setName('welcome-remove').setDescription('Removes the welcome channel.').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
    let updatedData = {};
    const record = await Guild.findByPk(interaction.guildId);

    if (!record.data) {
        updatedData.channel = {};
    } else {
        updatedData = record.data;
        updatedData.channel = {};
    }

    await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(async () => {
        interaction.reply({
            content: 'Welcome channel has been removed',
            flags: MessageFlags.Ephemeral,
        });
    });
}
