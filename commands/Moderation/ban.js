const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for ban').setMaxLength(512))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    const member = interaction.guild.members.cache.get(target.id);
    if (member) {
      if (!member.bannable) return interaction.editReply({ content: '❌ I cannot ban this user.' });
      if (member.roles.highest.position >= interaction.member.roles.highest.position)
        return interaction.editReply({ content: '❌ You cannot ban someone with an equal or higher role.' });
    }

    try {
      await interaction.guild.members.ban(target.id, { reason, deleteMessageDays: deleteDays });
      await logModAction({ guildId: interaction.guild.id, action: 'ban', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.tag, reason });

      const embed = new EmbedBuilder().setColor(0xed4245).setTitle('🔨 User Banned')
        .addFields({ name: 'User', value: `${target.tag} (${target.id})`, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to ban: ${err.message}` });
    }
  },
};
