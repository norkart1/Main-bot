const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName('user_id').setDescription('User ID to unban').setRequired(true).setMinLength(17).setMaxLength(20))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(512)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const ban = await interaction.guild.bans.fetch(userId);
      await interaction.guild.members.unban(userId, reason);
      await logModAction({ guildId: interaction.guild.id, action: 'unban', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: userId, targetTag: ban.user.tag, reason });

      const embed = new EmbedBuilder().setColor(0x57f287).setTitle('✅ User Unbanned')
        .addFields({ name: 'User', value: `${ban.user.tag} (${userId})`, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to unban: ${err.message}` });
    }
  },
};
