import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits, MessageFlags, ActivityType } from 'discord.js';
import dotenv from 'dotenv';

import { Bot } from './models/Bot.js';
import { Guild } from './models/Guild.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { data, execute } = await import(filePath);
    if (data && execute) {
        commands.set(data.name, { data, execute });
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, (c) => {
    const date = new Date();

    client.guilds.cache.forEach((guild) => {
        Guild.findOrCreate({ where: { guildId: guild.id } });
    });

    setTimeout(() => {
        Bot.findOrCreate({ where: { botId: c.user.id } })
            .catch((e) => {
                console.log('Unable to write to DB - BOT');
            })
            .then(() => {
                Bot.findByPk(c.user.id)
                    .then(async (data) => {
                        await Bot.update({ data: { uptime: { date } } }, { where: { botId: c.user.id } }).catch((e) => {
                            console.log(e);
                        });
                    })
                    .catch((e) => {
                        console.log(e);
                    });
            });
        console.log(`Logged in as ${c.user.username}.`);
        client.user.setActivity('Commands - /help', { type: ActivityType.Playing });
    }, 1000);
});

client.on('guildCreate', (guild) => {
    Guild.findOrCreate({ where: { guildId: guild.id } });
});

// Handles all commands
client.on('interactionCreate', (interaction) => {
    Guild.findOrCreate({ where: { guildId: interaction.guildId } }).then(async () => {
        if (interaction.isAnySelectMenu()) {
            try {
                if (interaction.member.roles.cache.has(interaction.values[0])) {
                    interaction.member.roles.remove(interaction.values[0]);
                    interaction.reply({ content: `<@&${interaction.values[0]}> has been removed from your user.`, flags: MessageFlags.Ephemeral });
                } else {
                    interaction.member.roles.add(interaction.values[0]);
                    interaction.reply({ content: `<@&${interaction.values[0]}> has been added to your user.`, flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                interaction.reply({ content: "Unable to change anyone's color with admin privileges.", flags: MessageFlags.Ephemeral });
            }
        }

        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        }
    });
});

// Times users out if they use prohibbited words
client.on(Events.MessageCreate, (message) => {
    if (
        message.author.bot ||
        message.content.startsWith('/dict') ||
        message.content.startsWith('/help') ||
        message.content.startsWith('/info') ||
        message.content.startsWith('/role') ||
        message.content.startsWith('/rules') ||
        message.content.startsWith('/uptime') ||
        message.content.startsWith('/welcome')
    )
        return;
    let currentData = [];

    Guild.findByPk(message.guildId)
        .then((data) => {
            let values = data.dataValues.data?.forbiddenWords;
            if (values !== null && values !== undefined) {
                values.map((word) => {
                    currentData.push(word);
                });
            }
        })
        .then(async () => {
            currentData.forEach(async (word) => {
                if (message.content.toLowerCase().includes(word)) {
                    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        message.delete();
                        return;
                    }
                    await message.member
                        .timeout(300000, `Used the word(s) ${word}`)
                        .then(() => {
                            message.channel.send(`${message.member} Stop right there criminal scum. You violated the law. You've been timed out.`);
                        })
                        .catch((e) => console.log(e.rawError.message));
                    message.delete();
                }
            });
        });
});

client.on('guildMemberAdd', async (member) => {
    try {
        const record = await Guild.findByPk(member.guild.id);
        let selectedChannel = {};

        if (record.data?.channel) selectedChannel = record.data.channel;

        const welcomeChannel = member.guild.channels.cache.find((channel) => channel.id === selectedChannel.id); // Replace 'general' with the name of your welcome channel

        welcomeChannel.send(`<@${member.user.id}> ${selectedChannel.message}`);

        const role = member.guild.roles.cache.get(selectedChannel.roleId);

        if (role) {
            member.roles.add(role).catch(console.error);
        } else {
            console.error(`Unable to give the role.`);
        }
    } catch (error) {
        console.log('Welcome channel not setup');
    }
});

client.login(process.env.BOT_TOKEN);
