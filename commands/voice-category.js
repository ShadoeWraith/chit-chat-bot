import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('category')
    .setDescription('Allows setting a temporary voice channel category')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) => subcommand.setName('setup').setDescription('Setup the category you want the temporary voice channels to occupy.'));

export async function execute(interaction) {
    console.log(`${interaction.user.displayName} (${interaction.user.username}) - used category setup`);
    const categories = [];
    const categoryNames = [];
    const categoryOptions = [];

    await interaction.guild.channels.cache.filter((channel) => {
        if (channel.parentId === null) return;

        if (!categories.some((category) => category.id === channel.parentId)) categories.push({ id: channel.parentId, name: channel.parent.name });
    });

    if (categories.length === 0) {
        await interaction.reply({
            content: 'Need to have an existing category with at least one text/voice channel within it to find the category.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    categories.forEach((category) => {
        categoryOptions.push(new StringSelectMenuOptionBuilder().setLabel(category.name).setValue(category.id));
        categoryNames.push(category.name);
    });

    const categorySelectMenu = new StringSelectMenuBuilder().setCustomId('categorySelectionMenu').setPlaceholder('Select a category').addOptions(categoryOptions);

    const row = new ActionRowBuilder().addComponents(categorySelectMenu);

    const embed = new EmbedBuilder()
        .setTitle('Category select')
        .setDescription('Sets the category where the temporary voice channels can go.')
        .addFields({ name: 'Categories', value: categoryNames.join('\n') });

    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}
