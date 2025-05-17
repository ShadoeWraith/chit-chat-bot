import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder().setName('help').setDescription('Displays a list of commands.');

export async function execute(interaction) {
    console.log(`${interaction.user.displayName} (${interaction.user.username}) - used help`);

    let publicCommands = [
        { name: '/help', description: 'Displays a list of commands.' },
        { name: '/uptime', description: 'Displays the uptime since the bot came online.' },
        { name: '/roles assign', description: 'Displays a role assign selection.' },
        { name: '/info', description: 'Displays info about a selected user.' },
        { name: '/voice create', description: 'Creates a temporary voice channel.' },
        { name: '/voice delete', description: 'Deletes a temporary voice channel.' },
    ];
    let adminCommands = [
        { name: '/dict', description: 'Displays dictionary of prohibited words.' },
        { name: '/dict add', description: 'Adds a word to the dictionary.' },
        { name: '/dict remove', description: 'Removes a word from the dictionary.' },
        { name: '/role add', description: 'Adds a role for role assign.' },
        { name: '/role remove', description: 'Removes a role from role assign.' },
        { name: '/rules display', description: 'Displays the rules of the server to everyone.' },
        { name: '/rules add', description: 'Adds a rule to the rule list.' },
        { name: '/rules remove', description: 'Removes a rule from the rule list.' },
        { name: '/welcome setup', description: 'Setup a welcome channel for the bot.' },
        { name: '/welcome display', description: 'Displays the welcome channel that was set.' },
        { name: '/welcome remove', description: 'Removes the welcome channel that was set.' },
        { name: '/category setup', description: 'Sets a category for temporary voice channels.' },
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
        .setColor(0x0099ff)
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
