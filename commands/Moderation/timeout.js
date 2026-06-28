const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction, parseDuration } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Duration: 10s, 5m, 1h, 1d (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(512)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    const ms = parseDuration(durationStr);
    if (!ms) return interaction.editReply({ content: '❌ Invalid duration. Use: `10s`, `5m`, `2h`, `1d` (max 28d).' });
    if (!target.moderatable) return interaction.editReply({ content: '❌ I cannot timeout this user.' });

    try {
      await target.timeout(ms, reason);
      await logModAction({ guildId: interaction.guild.id, action: 'timeout', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.user.tag, reason });

      const embed = new EmbedBuilder().setColor(0xffa500).setTitle('⏱️ User Timed Out')
        .addFields({ name: 'User', value: `${target.user.tag}`, inline: true }, { name: 'Duration', value: durationStr, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
