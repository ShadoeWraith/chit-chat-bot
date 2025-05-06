import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('role-remove')
    .setDescription('Removes a role from list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addRoleOption((option) => option.setName('role').setDescription('The role to remove from the list.').setRequired(true));

export async function execute(interaction) {
    dbSync(interaction.guildId);
    let input = interaction.options.getRole('role');
    let removeRole = true;
    let newData = [];

    const record = await Guild.findByPk(interaction.guildId);

    if (record.data.roles.length !== 0) {
        if (record.data.roles.includes(input.id)) removeRole = false;
        record.data.roles.map((role) => {
            newData.push(role);

            newData = newData.filter((role) => {
                return role.id !== input.id;
            });

            if (newData.includes(input)) removeRole = false;
        });

        if (removeRole) {
            let updatedData = record.data;

            if (updatedData.roles === undefined) updatedData = { ...updatedData, roles: [...newData] };
            else updatedData.roles = newData;

            await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                interaction.reply({ content: `**${input}** has been removed from the list.`, flags: MessageFlags.Ephemeral });
            });
        } else {
            interaction.reply({ content: `**${input}** does not exist in the list.`, flags: MessageFlags.Ephemeral });
        }
    } else {
        interaction.reply({ content: 'No roles in the list.', flags: MessageFlags.Ephemeral });
    }
}
