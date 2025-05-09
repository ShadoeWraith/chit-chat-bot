import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { format } from 'date-fns';

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Displays info about yourself.')
    .addUserOption((option) => option.setName('user').setDescription('The user you would like to view').setRequired(true));

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const guild = interaction.guild;
    const member = await guild.members.fetch(targetUser.id);

    const userRoles = [];
    member.roles.cache.map((role) => {
        if (role.name !== '@everyone') userRoles.push(`<@&${role.id}>`);
    });

    const createdAt = format(member.user.createdAt, 'MM/dd/yyyy');
    const joinedAt = format(member.joinedAt, 'MM/dd/yyyy');

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${member.user.globalName ? member.user.globalName : member.user.username}'s Information`)
        .setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription('Displaying pointless information just because I was bored and wanted to keep working on the bot.')
        .addFields(
            { name: 'Display Name', value: member.user.globalName ? member.user.globalName : 'No Display Name' },
            { name: 'Username', value: member.user.username },
            { name: 'ID', value: member.user.id },
            { name: 'Account Created', value: createdAt },
            { name: 'Joined Server', value: joinedAt },
            { name: 'Roles', value: userRoles.length !== 0 ? userRoles.join(' | ') : 'No Roles' }
        )
        .setTimestamp();

    interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
