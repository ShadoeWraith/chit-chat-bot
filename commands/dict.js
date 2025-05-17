import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('dict')
    .setDescription('Dictionary command for forbidden words')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) => subcommand.setName('display').setDescription('Displays all the forbidden words in the dictionary.'))
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
            .setDescription('Adds a word to the forbidden words dictionary.')
            .addStringOption((option) => option.setName('word').setDescription('Add the word you want to forbid.').setRequired(true))
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('Removes a word from the forbidden words dictionary.')
            .addStringOption((option) => option.setName('word').setDescription('Remove the word from the dictionary.').setRequired(true))
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    let input = '';
    let embed = new EmbedBuilder().setColor(0x0099ff);

    if (subcommand !== 'display') input = interaction.options.getString('word').toLowerCase();

    const record = await Guild.findByPk(interaction.guildId);

    switch (subcommand) {
        case 'display': {
            console.log(`${interaction.user.displayName} (${interaction.user.username}) - used dict display`);
            let prohibitedWords = [];

            let values = record.data?.forbiddenWords;
            if (values !== null && values !== undefined) {
                values.map((word) => {
                    prohibitedWords.push(word);
                });
            }

            embed.addFields({
                name: 'List of prohibited words.',
                value: `${prohibitedWords.length > 0 ? prohibitedWords.join('\n') : 'No words in the dictionary.'}`,
            });

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            break;
        }

        case 'add': {
            console.log(`${interaction.user.displayName} (${interaction.user.username}) - used dict add for ${input}`);
            let addWord = true;

            if (record.data?.forbiddenWords) {
                record.data.forbiddenWords.map((word) => {
                    if (word === input) {
                        addWord = false;
                    }
                });
            }

            if (addWord) {
                let updatedData = record.data;

                if (updatedData === null || updatedData.forbiddenWords === undefined) updatedData = { ...updatedData, forbiddenWords: [input] };
                else updatedData.forbiddenWords.push(input);

                await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                    interaction.reply({ content: `**${input}** has been added to dictionary.`, flags: MessageFlags.Ephemeral });
                });
            } else {
                interaction.reply({ content: `**${input}** already exists in the dictionary.`, flags: MessageFlags.Ephemeral });
            }
            break;
        }

        case 'remove': {
            console.log(`${interaction.user.displayName} (${interaction.user.username}) - used dict remove on ${input}`);
            let removeWord = true;
            let newData = [];

            try {
                if (record.data.forbiddenWords) {
                    if (!record.data.forbiddenWords.includes(input)) removeWord = false;
                    record.data.forbiddenWords.map((word) => {
                        newData.push(word);

                        newData = newData.filter((word) => {
                            return word !== input;
                        });

                        if (newData.includes(input)) removeWord = false;
                    });
                }

                if (removeWord) {
                    let updatedData = record.data;

                    if (updatedData.forbiddenWords === undefined) updatedData = { ...updatedData, forbiddenWords: [...newData] };
                    else updatedData.forbiddenWords = newData;

                    await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                        interaction.reply({ content: `**${input}** has been removed from the dictionary.`, flags: MessageFlags.Ephemeral });
                    });
                } else {
                    interaction.reply({ content: `**${input}** does not exist in the dictionary.`, flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                interaction.reply({ content: 'No words in the dictionary to remove.', flags: MessageFlags.Ephemeral });
            }
            break;
        }
    }
}
