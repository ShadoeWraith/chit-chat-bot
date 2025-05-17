import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { intervalToDuration, differenceInDays } from 'date-fns';
import { Bot } from '../models/Bot.js';

export const data = new SlashCommandBuilder().setName('uptime').setDescription('Displays the uptime of the bot.');

export async function execute(interaction) {
    console.log(`${interaction.user.displayName} (${interaction.user.username}) - used uptime`);
    let currentDate = new Date();
    Bot.findByPk(interaction.client.user.id)
        .then(async (data) => {
            let uptime = data.dataValues.data?.uptime;
            let { hours, minutes, seconds } = intervalToDuration({ start: uptime.date, end: currentDate });
            let days = differenceInDays(currentDate, uptime.date);

            if (days === undefined) days = '0';
            if (hours === undefined) hours = '0';
            if (minutes === undefined) minutes = '0';
            if (seconds === undefined) seconds = '0';

            const embed = new EmbedBuilder().setColor('#8855ff').setTitle('Uptime').setDescription(`:clock1: ${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`).setTimestamp();
            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        })
        .catch((e) => {
            console.log(e);
        });
}
