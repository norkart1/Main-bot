const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(512)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.editReply({ content: '❌ User not found in this server.' });
    if (!target.kickable) return interaction.editReply({ content: '❌ I cannot kick this user.' });
    if (target.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.editReply({ content: '❌ You cannot kick someone with an equal or higher role.' });

    try {
      await target.kick(reason);
      await logModAction({ guildId: interaction.guild.id, action: 'kick', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.user.tag, reason });

      const embed = new EmbedBuilder().setColor(0xfee75c).setTitle('👢 User Kicked')
        .addFields({ name: 'User', value: `${target.user.tag} (${target.id})`, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true }, { name: 'Reason', value: reason })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to kick: ${err.message}` });
    }
  },
};
