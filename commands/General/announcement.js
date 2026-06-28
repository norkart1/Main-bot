const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Open the dashboard to send an announcement to this server'),

  async execute(interaction) {
    const dashUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/announcements`
      : 'your BotDash dashboard → Announcements';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📢 Send an Announcement')
      .setDescription(
        'Use the BotDash control panel to compose and send an announcement to this server.\n\n' +
        'You can add a **header**, **message content**, an **image**, and an optional **sender name**.'
      )
      .addFields({ name: '🔗 Dashboard Link', value: dashUrl })
      .setFooter({ text: 'The announcement will be posted to the server\'s announcement channel.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
