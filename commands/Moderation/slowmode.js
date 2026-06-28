const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel (0 to disable)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) => o.setName('seconds').setDescription('Seconds between messages (0-21600)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);
      const msg = seconds === 0 ? '✅ Slowmode disabled.' : `✅ Slowmode set to **${seconds}s** in ${interaction.channel}.`;
      await interaction.editReply({ content: msg });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
