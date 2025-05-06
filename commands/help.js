import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { dbSync } from '../utils/dbsync.js';

export const data = new SlashCommandBuilder().setName('help').setDescription('Displays a list of commands.');

export async function execute(interaction) {
    dbSync(interaction.guildId);

    let publicCommands = [
        { name: '/help', description: 'Displays a list of commands.' },
        { name: '/uptime', description: 'Displays the uptime since the bot came online.' },
        { name: '/role-assign', description: 'Displays a role assign selection.' },
    ];
    let adminCommands = [
        { name: '/dict', description: 'Displays dictionary of prohibited words.' },
        { name: '/dict-add', description: 'Adds a word to the dictionary.' },
        { name: '/dict-remove', description: 'Removes a word from the dictionary.' },
        { name: '/role-add', description: 'Adds a role for role assign.' },
        { name: '/role-remove', description: 'Removes a role from role assign.' },
    ];

    let publicList = [];
    let adminList = [];

    publicCommands.map((command) => {
        publicList.push(`**${command.name}** - ${command.description}`);
    });

    adminCommands.map((command) => {
        adminList.push(`**${command.name}** - ${command.description}`);
    });

    const embed = new EmbedBuilder()
        .setColor(0x00aa00)
        .setTitle('Bot Commands')
        .setDescription('Commands available for public and admins')
        .addFields(
            {
                name: 'Public Commands',
                value: publicList.join('\n'),
            },
            {
                name: 'Admin Commands',
                value: adminList.join('\n'),
            }
        );

    interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
