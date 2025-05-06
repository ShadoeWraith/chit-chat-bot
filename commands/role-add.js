import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('role-add')
    .setDescription('Adds a role to the list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addRoleOption((option) => option.setName('role').setDescription('The role to add to the list.').setRequired(true));

export async function execute(interaction) {
    let input = interaction.options.getRole('role');
    let addRole = true;

    const record = await Guild.findByPk(interaction.guildId);

    if (record.data?.roles) {
        record.data.roles.map((data) => {
            if (data.id === input.id) {
                addRole = false;
            }
        });
    }

    if (addRole) {
        let updatedData = record.data;

        if (updatedData === null || updatedData.roles === undefined) updatedData = { ...updatedData, roles: [{ id: input.id, label: input.name }] };
        else updatedData.roles.push({ id: input.id, label: input.name });

        await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(async () => {
            await interaction.reply({ content: `**${input}** has been added to the list.`, flags: MessageFlags.Ephemeral });
        });
    } else {
        await interaction.reply({ content: `${input} already exists in the list.`, flags: MessageFlags.Ephemeral });
    }
}
