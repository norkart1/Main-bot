const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deafen')
    .setDescription('Server-deafen a member in voice')
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to deafen').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(200)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (!target.voice.channel) return interaction.editReply({ content: '❌ User is not in a voice channel.' });
    if (target.voice.serverDeaf) return interaction.editReply({ content: '❌ User is already deafened.' });

    try {
      await target.voice.setDeaf(true, reason);
      await interaction.editReply({ content: `✅ Server-deafened **${target.user.tag}**.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
