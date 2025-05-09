import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Select a channel to welcome new members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) =>
        subcommand
            .setName('setup')
            .setDescription('Select a channel to welcome new members, as well allow assigning a default member role.')
            .addChannelOption((option) => option.setName('channel').setDescription('Select a channel.').setRequired(true))
            .addStringOption((option) => option.setName('message').setDescription('The message you want the bot to welcome users with.').setRequired(true))
            .addRoleOption((option) => option.setName('role').setDescription('Set a role to give to new users upon joining').setRequired(false))
    )
    .addSubcommand((subcommand) => subcommand.setName('display').setDescription('Select a channel to welcome new members, as well allow assigning a default member role.'))
    .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the welcome channel.'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    const record = await Guild.findByPk(interaction.guildId);
    let embed = new EmbedBuilder().setColor(0x0099ff);

    let updatedData = {};

    switch (subcommand) {
        case 'display': {
            let currentChannel = {};

            if (!record.data || Object.keys(record.data.channel).length === 0) {
                interaction.reply({
                    content: 'No welcome channel setup. Use `/welcome-channel` to set one up.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                currentChannel = record.data.channel;

                setEmbed(embed, currentChannel.id, currentChannel.roleId, currentChannel.message);

                interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral,
                });
            }

            break;
        }

        case 'setup': {
            let channel = interaction.options.getChannel('channel');
            let message = interaction.options.getString('message');
            let role = interaction.options.getRole('role');

            if (!record.data) {
                updatedData.channel = { id: channel.id, message: message, roleId: role ? role.id : '' };
            } else {
                updatedData = record.data;
                updatedData.channel = { id: channel.id, message: message, roleId: role ? role.id : '' };
            }

            setEmbed(embed, channel.id, role.id, message);

            updateGuild(updatedData, interaction, null, embed);

            break;
        }

        case 'remove': {
            if (!record.data) {
                updatedData.channel = {};
            } else {
                updatedData = record.data;
                updatedData.channel = {};
            }

            updateGuild(updatedData, interaction, 'Welcome channel has been removed.', null);

            break;
        }
    }
}

const setEmbed = (embed, channelId, roleId, message) => {
    console.log(roleId);

    embed
        .setTitle('Welcome Channel Information')
        .setDescription('Displays the welcome channel, role, and message you chose for this server.')
        .addFields({ name: 'Selected Channel', value: `<#${channelId}>` })
        .addFields({ name: 'Memeber Role', value: roleId ? `<@&${roleId}>` : 'No Role Selected' })
        .addFields({ name: 'Welcome Message', value: message });
};

const updateGuild = async (data, interaction, content, embed) => {
    await Guild.update({ data: data }, { where: { guildId: interaction.guildId } }).then(async () => {
        if (content !== null) {
            interaction.reply({
                content: content,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
        }
    });
};
