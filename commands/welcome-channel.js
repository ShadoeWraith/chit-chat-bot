import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('welcome-channel')
    .setDescription('Select a channel to welcome new members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((option) => option.setName('channel').setDescription('Select a channel.').setRequired(true))
    .addStringOption((option) => option.setName('message').setDescription('The message you want the bot to welcome users with.').setRequired(true))
    .addRoleOption((option) => option.setName('role').setDescription('Set a role to give to new users upon joining').setRequired(false));

export async function execute(interaction) {
    let channel = interaction.options.getChannel('channel');
    let message = interaction.options.getString('message');
    let role = interaction.options.getRole('role');
    let updatedData = {};
    const record = await Guild.findByPk(interaction.guildId);

    if (!record.data) {
        updatedData.channel = { id: channel.id, name: channel.name, message: message, roleId: role ? role.id : '' };
    } else {
        updatedData = record.data;
        updatedData.channel = { id: channel.id, name: channel.name, message: message, roleId: role ? role.id : '' };
    }

    const embed = new EmbedBuilder()
        .setTitle('Welcome Channel Information')
        .setDescription('Displays the channel and the message you chose for this server.')
        .addFields({ name: 'Selected Channel', value: `<#${channel.id}>` })
        .addFields({ name: 'Memeber Role', value: role ? `<@&${role.id}>` : 'No Role Selected' })
        .addFields({ name: 'Welcome Message', value: message });

    await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(async () => {
        interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    });
}
