import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { Guild } from '../models/Guild.js';

export const data = new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Adds a role to the list for auto assign roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((subcommand) =>
        subcommand
            .setName('display')
            .setDescription('Displays the rules you set for the server.')
            .addBooleanOption((option) => option.setName('ephemeral').setDescription('Displays only to you.').setRequired(false))
    )
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
            let ephemeral = interaction.options.getBoolean('ephemeral');

            let values = record.data?.rules;
            if (values !== null && values !== undefined) {
                values.map((word, index) => {
                    rules.push(`**${index + 1}.** ${word}`);
                });
            }

            setEmbed(embed, rules);

            interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : '' });
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

            setEmbed(embed, rules);

            updateGuild(updatedData, interaction, null, embed);

            break;
        }

        case 'remove': {
            let number = interaction.options.getNumber('number');

            let removeRule = true;
            let newData = [];

            if (record.data.rules) {
                if (record.data.rules.length < number - 1 || number <= 0) removeRule = false;

                record.data.rules.map((rule) => {
                    newData.push(rule);
                });

                newData = newData.filter((rule, index) => {
                    return index !== number - 1;
                });
            }

            if (removeRule) {
                let updatedData = record.data;

                if (updatedData.rules === undefined) updatedData = { ...updatedData, rules: [...newData] };
                else updatedData.rules = newData;

                updateGuild(updatedData, interaction, 'the rule has been removed.', null);
            } else {
                interaction.reply({ content: 'No rule with that number exists.', flags: MessageFlags.Ephemeral });
            }
            break;
        }
    }
}

const setEmbed = (embed, rules) => {
    embed
        .setTitle('Server Rules')
        .setDescription('Rules for the server that must be followed.')
        .addFields({ name: 'Rules', value: rules.join('\n\n') });
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
