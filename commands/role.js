import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Adds a role to the list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
            .setDescription('Adds a role to the list for auto assign roles.')
            .addRoleOption((option) => option.setName('role').setDescription('The role to add to the list.').setRequired(true))
    )

    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('Removes the welcome channel.')
            .addRoleOption((option) => option.setName('role').setDescription('The role to remove from the list.').setRequired(true))
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    const record = await Guild.findByPk(interaction.guildId);
    let input = interaction.options.getRole('role');

    switch (subcommand) {
        case 'add': {
            let addRole = true;

            if (record.data.roles) {
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

                updateGuild(updatedData, interaction, `**${input}** has been added to the list.`);
            } else {
                await interaction.reply({ content: `${input} already exists in the list.`, flags: MessageFlags.Ephemeral });
            }
            break;
        }

        case 'remove': {
            let removeRole = true;
            let newData = [];

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

                    updateGuild(updatedData, interaction, `**${input}** has been removed from the list.`);
                } else {
                    interaction.reply({ content: `**${input}** does not exist in the list.`, flags: MessageFlags.Ephemeral });
                }
            } else {
                interaction.reply({ content: 'No roles in the list.', flags: MessageFlags.Ephemeral });
            }
            break;
        }
    }
}

const updateGuild = async (data, interaction, content) => {
    await Guild.update({ data: data }, { where: { guildId: interaction.guildId } }).then(async () => {
        interaction.reply({
            content: content,
            flags: MessageFlags.Ephemeral,
        });
    });
};
