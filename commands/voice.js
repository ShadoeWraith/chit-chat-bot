import { SlashCommandBuilder, MessageFlags, PermissionsBitField } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Allows editing a temporary voice channel')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('create')
            .setDescription('Create a temporary voice channel.')
            .addStringOption((option) => option.setName('name').setDescription('Temporary voice channel name.').setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName('delete').setDescription('Deletes your voice channel.'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    let input = interaction.options.getString('name');
    const record = await Guild.findByPk(interaction.guildId);
    let updatedData = record.data;

    switch (subcommand) {
        case 'create': {
            console.log(`${interaction.user.displayName} (${interaction.user.username}) - used voice create with the name ${input}`);
            let channel = {};
            let newData = [];
            let createChannel = true;

            const voiceChannel = interaction.guild.channels.cache.find((c) => c.name === input);

            if (record.data?.tempVoiceId !== null) {
                if (voiceChannel !== undefined) {
                    if (voiceChannel.name === input) {
                        createChannel = false;
                        await interaction.reply({ content: 'Channel names must be unique.', flags: MessageFlags.Ephemeral });
                    }
                }

                if (createChannel) {
                    try {
                        if (record.data?.voiceChannels) {
                            record.data.voiceChannels.map((channel) => {
                                newData.push(channel);
                            });
                        }

                        if (record.data?.voiceChannels) {
                            updatedData.voiceChannels.filter(async (channel) => {
                                if (channel.ownerId === interaction.user.id) {
                                    const oldChannel = interaction.guild.channels.cache.get(channel.id);
                                    if (oldChannel) await oldChannel.delete();
                                }
                            });
                        }

                        updatedData.voiceChannels = updatedData.voiceChannels.filter((c) => {
                            return c.ownerId !== interaction.user.id;
                        });

                        channel = await interaction.guild.channels.create({
                            name: input,
                            type: 2,
                            parent: record.data.tempVoiceId,
                        });

                        if (updatedData === null || updatedData.voiceChannels === undefined) updatedData = { ...updatedData, voiceChannels: [{ ownerId: interaction.user.id, id: channel.id }] };
                        else {
                            updatedData.voiceChannels.push({ ownerId: interaction.user.id, id: channel.id });
                        }

                        await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                            interaction.reply({ content: `Voice channel **${input}** created successfully!`, flags: MessageFlags.Ephemeral });
                        });
                    } catch (error) {
                        console.error('Failed to create channel:', error);
                        await interaction.reply({ content: 'There was an error creating the voice channel.', flags: MessageFlags.Ephemeral });
                    }
                }
            } else {
                await interaction.reply({ content: 'There is no temporary voice channel catergory set. Ask an admin/mod to add one if you would like to use this feature.', flags: MessageFlags.Ephemeral });
            }
            break;
        }

        case 'delete': {
            console.log(`${interaction.user.displayName} (${interaction.user.username}) - used voice remove`);
            let newData = [];

            try {
                if (record.data?.voiceChannels) {
                    record.data.voiceChannels.map((channel) => {
                        newData.push(channel);
                    });
                }

                updatedData = record.data;
                let oldChannel = {};

                if (record.data?.voiceChannels) {
                    updatedData.voiceChannels.filter(async (channel) => {
                        if (channel.ownerId === interaction.user.id) {
                            oldChannel = interaction.guild.channels.cache.get(channel.id);
                        }
                    });
                }

                newData = newData.filter((c) => {
                    return c.ownerId !== interaction.user.id;
                });

                if (updatedData.voiceChannels === undefined) updatedData = { ...updatedData, voiceChannels: [...newData] };
                else updatedData.voiceChannels = newData;

                await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                    oldChannel.delete();
                    interaction.reply({ content: `Your voice channel has been deleted.`, flags: MessageFlags.Ephemeral });
                });
            } catch (error) {
                interaction.reply({ content: 'Unable to delete channel.', flags: MessageFlags.Ephemeral });
            }
            break;
        }
    }
}
