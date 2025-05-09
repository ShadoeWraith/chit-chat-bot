import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Adds a role to the list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand((subcommand) => subcommand.setName('assign').setDescription('Displays the assign role menu.'));

export async function execute(interaction) {
    const record = await Guild.findByPk(interaction.guildId);

    const roleOptions = [];
    const roleList = [];

    try {
        record.data.roles.forEach((role) => {
            roleOptions.push(new StringSelectMenuOptionBuilder().setLabel(role.label).setValue(role.id));

            roleList.push(`* <@&${role.id}>`);
        });

        const roleSelectMenu = new StringSelectMenuBuilder().setCustomId('roleSelectMenu').setPlaceholder('Select a role').addOptions(roleOptions);

        const row = new ActionRowBuilder().addComponents(roleSelectMenu);

        const embed = new EmbedBuilder()
            .setTitle('Role Color Select')
            .setDescription('Toggle a role that changes the color of your name.')
            .addFields({ name: 'Available Roles', value: roleList.join('\n') });

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral,
        });
    } catch (error) {
        await interaction.reply({
            content: 'Add roles to display role selection menu.',
            flags: MessageFlags.Ephemeral,
        });
    }
}
