import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder().setName('welcome-display').setDescription('Display the welcome channel information.').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
    let currentChannel = {};
    const record = await Guild.findByPk(interaction.guildId);

    if (!record.data || Object.keys(record.data.channel).length === 0) {
        interaction.reply({
            content: 'No welcome channel setup. Use `/welcome-channel` to set one up.',
            flags: MessageFlags.Ephemeral,
        });
    } else {
        currentChannel = record.data.channel;

        const embed = new EmbedBuilder()
            .setTitle('Welcome Channel Information')
            .setDescription('Displays the welcome channel, role, and message you chose for this server.')
            .addFields({ name: 'Selected Channel', value: `<#${currentChannel.id}>` })
            .addFields({ name: 'Memeber Role', value: currentChannel.roleId ? `<@&${currentChannel.roleId}>` : 'No Role Selected' })
            .addFields({ name: 'Welcome Message', value: currentChannel.message });

        interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    }
}
