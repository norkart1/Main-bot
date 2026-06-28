const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('undeafen')
    .setDescription('Remove server-deafen from a member in voice')
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to undeafen').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (!target.voice.channel) return interaction.editReply({ content: '❌ User is not in a voice channel.' });
    if (!target.voice.serverDeaf) return interaction.editReply({ content: '❌ User is not deafened.' });

    try {
      await target.voice.setDeaf(false);
      await interaction.editReply({ content: `✅ Undeafened **${target.user.tag}**.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
