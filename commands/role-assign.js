import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder().setName('role-assign').setDescription('Displays the assign role menu.');

export async function execute(interaction) {
    dbSync(interaction.guildId);
    const record = await Guild.findByPk(interaction.guildId);

    const roleOptions = [];
    const roleList = [];

    try {
        record.data.roles.forEach((role) => {
            roleOptions.push(new StringSelectMenuOptionBuilder().setLabel(role.label).setValue(role.id));

            roleList.push(`<@&${role.id}>`);
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
