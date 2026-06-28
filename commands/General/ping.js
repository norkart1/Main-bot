const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency and uptime'),
  async execute(interaction, client) {
    const ping = client.ws.ping;
    const uptime = formatUptime(client.uptime);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'API Latency', value: `${ping}ms`, inline: true },
        { name: 'Uptime', value: uptime, inline: true }
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
