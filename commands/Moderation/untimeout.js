const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to untimeout').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(512)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (!target.isCommunicationDisabled()) return interaction.editReply({ content: '❌ This user is not currently timed out.' });

    try {
      await target.timeout(null, reason);
      await logModAction({ guildId: interaction.guild.id, action: 'untimeout', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.user.tag, reason });

      const embed = new EmbedBuilder().setColor(0x57f287).setTitle('✅ Timeout Removed')
        .addFields({ name: 'User', value: target.user.tag, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
