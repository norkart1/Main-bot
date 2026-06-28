const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { clearWarnings, logModAction } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) => o.setName('user').setDescription('User to clear').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user');

    try {
      const count = await clearWarnings(interaction.guild.id, target.id);
      await logModAction({ guildId: interaction.guild.id, action: 'clearwarnings', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.tag, reason: `Cleared ${count} warning(s)` });

      await interaction.editReply({ content: `✅ Cleared **${count}** warning(s) for **${target.tag}**.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
