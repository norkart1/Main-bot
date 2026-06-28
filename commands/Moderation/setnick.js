const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setnick')
    .setDescription('Change a member\'s nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) => o.setName('user').setDescription('User to rename').setRequired(true))
    .addStringOption((o) => o.setName('nickname').setDescription('New nickname (leave blank to reset)').setMaxLength(32)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const nick = interaction.options.getString('nickname') || null;

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (!target.manageable) return interaction.editReply({ content: '❌ I cannot manage this user.' });

    try {
      await target.setNickname(nick, `Changed by ${interaction.user.tag}`);
      await interaction.editReply({ content: nick ? `✅ Renamed **${target.user.tag}** to **${nick}**.` : `✅ Reset **${target.user.tag}**'s nickname.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
