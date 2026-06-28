const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { logModAction, addWarning, getWarnings } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for warning').setRequired(true).setMaxLength(512)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) return interaction.editReply({ content: '❌ User not in this server.' });

    try {
      const warnId = await addWarning({ guildId: interaction.guild.id, targetId: target.id, targetTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
      const allWarnings = await getWarnings(interaction.guild.id, target.id);
      await logModAction({ guildId: interaction.guild.id, action: 'warn', moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, targetId: target.id, targetTag: target.tag, reason });

      try {
        await target.send(`⚠️ You have been warned in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${allWarnings.length}`);
      } catch (_) {}

      const embed = new EmbedBuilder().setColor(0xfee75c).setTitle('⚠️ Warning Issued')
        .addFields({ name: 'User', value: `${target.tag}`, inline: true }, { name: 'Total Warnings', value: `${allWarnings.length}`, inline: true }, { name: 'Reason', value: reason }, { name: 'Warning ID', value: `\`${warnId}\`` })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
