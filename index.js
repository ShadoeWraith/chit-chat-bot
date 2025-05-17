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
            if (interaction.customId === 'roleSelectMenu') {
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

            if (interaction.customId === 'categorySelectionMenu') {
                let updatedData = {};
                const record = await Guild.findByPk(interaction.guildId);

                if (!record.data) {
                    updatedData.tempVoiceId = interaction.values[0];
                } else {
                    updatedData = record.data;
                    updatedData.tempVoiceId = interaction.values[0];
                }

                await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(async () => {
                    await interaction.reply({ content: `**<#${interaction.values[0]}>** has been assigned for temporary voice channels.`, flags: MessageFlags.Ephemeral });
                });
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

client.on('voiceStateUpdate', (oldState, newState) => {
    const channel = oldState.channel || newState.channel; // Get the channel from either old or new state
    if (!channel) return;

    const isTargetChannel = channel.id === 'YOUR_CHANNEL_ID'; // Replace with your channel ID

    if (isTargetChannel && oldState.channel.members.size === 0 && oldState.channel.id === newState.channel.id) {
        console.log('Empty voice channel detected:', channel.name);

        // Set a timeout to delete the channel
        const timeoutID = setTimeout(async () => {
            if (oldState.channel.members.size === 0 && oldState.channel.id === newState.channel.id) {
                try {
                    await channel.delete();
                    console.log('Deleted voice channel:', channel.name);
                } catch (error) {
                    console.error('Error deleting channel:', error);
                }
            }
        }, 30000); // Delete after 30 seconds

        // Reset the timeout if the channel becomes populated before it expires
        client.on('voiceStateUpdate', (oldState2, newState2) => {
            if (newState2.channel.id === channel.id && newState2.channel.members.size > 0) {
                clearTimeout(timeoutID);
                console.log('Voice channel is populated, clearing timeout:', channel.name);
            }
        });
    }
});

client.login(process.env.BOT_TOKEN);
