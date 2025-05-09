import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Adds a role to the list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) => subcommand.setName('display').setDescription('Displays the rules you set for the server.'))
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
            .setDescription('Add a rule to the server.')
            .addStringOption((option) => option.setName('rule').setDescription('Add a rule for your server to display.').setRequired(true))
    )

    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('Remove a rule by the rule number.')
            .addNumberOption((option) => option.setName('number').setDescription('Select the number for the rule you want to remove.').setRequired(true))
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand(false);
    const record = await Guild.findByPk(interaction.guildId);
    let embed = new EmbedBuilder().setColor(0x0099ff);

    switch (subcommand) {
        case 'display': {
            let rules = [];

            let values = record.data?.rules;
            if (values !== null && values !== undefined) {
                values.map((word, index) => {
                    rules.push(`**${index + 1}.** ${word}`);
                });
            }

            embed
                .setTitle('Server Rules')
                .setDescription('Rules for the server that must be followed.')
                .addFields({ name: 'Rules', value: rules.join('\n\n') });

            interaction.reply({ embeds: [embed] });
            break;
        }
        case 'add': {
            let input = interaction.options.getString('rule');

            let updatedData = record.data;
            let rules = [];

            if (updatedData === null || updatedData.rules === undefined) updatedData = { ...updatedData, rules: [input] };
            else updatedData.rules.push(input);

            updatedData.rules.map((rule, index) => {
                rules.push(`**${index + 1}.** ${rule}`);
            });

            embed
                .setTitle('Server Rules')
                .setDescription('Rules for the server that must be followed.')
                .addFields({ name: 'Rules', value: rules.join('\n\n') });

            await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } })
                .then(() => {
                    interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                })
                .catch((e) => console.log(e));

            break;
        }

        case 'remove': {
            let number = interaction.options.getNumber('number');

            let removeRule = true;
            let newData = [];

            console.log(number);

            try {
                if (record.data.rules) {
                    if (record.data.rules.length < number - 1) removeRule = false;

                    record.data.rules.map((rule) => {
                        newData.push(rule);
                    });

                    newData = newData.filter((rule, index) => {
                        return index !== number - 1;
                    });

                    console.log(newData);
                }

                if (removeRule) {
                    let updatedData = record.data;

                    if (updatedData.rules === undefined) updatedData = { ...updatedData, rules: [...newData] };
                    else updatedData.rules = newData;

                    await Guild.update({ data: updatedData }, { where: { guildId: interaction.guildId } }).then(() => {
                        interaction.reply({ content: `has been removed from the dictionary.`, flags: MessageFlags.Ephemeral });
                    });
                } else {
                    interaction.reply({ content: `does not exist in the dictionary.`, flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.log(error);
                interaction.reply({ content: 'No words in the dictionary to remove.', flags: MessageFlags.Ephemeral });
            }
            break;
        }
    }
}

const updateGuild = async (data, interaction, embed) => {
    await Guild.update({ data: data }, { where: { guildId: interaction.guildId } }).then(async () => {
        interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    });
};
