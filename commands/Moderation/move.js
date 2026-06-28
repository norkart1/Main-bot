const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a member to a different voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to move').setRequired(true))
    .addChannelOption((o) => o.setName('channel').setDescription('Target voice channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getMember('user');
    const channel = interaction.options.getChannel('channel');

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (!target.voice.channel) return interaction.editReply({ content: '❌ This user is not in a voice channel.' });

    try {
      await target.voice.setChannel(channel, `Moved by ${interaction.user.tag}`);
      await interaction.editReply({ content: `✅ Moved **${target.user.tag}** to **${channel.name}**.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
