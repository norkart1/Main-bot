const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show detailed info about a user')
    .addUserOption((o) => o.setName('user').setDescription('User to inspect (default: yourself)')),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user;

    await user.fetch(true);

    const roles = target.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
    const topRoles = roles.first(10).map((r) => r.toString()).join(', ') || 'None';
    const joinPos = (await interaction.guild.members.fetch())
      .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
      .map((m) => m.id)
      .indexOf(target.id) + 1;

    const flags = user.flags?.toArray() || [];
    const badges = flags.map((f) => f.replace(/_/g, ' ')).join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || 0x5865f2)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '📥 Joined Server', value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true },
        { name: '📊 Join Position', value: `#${joinPos}`, inline: true },
        { name: '🎭 Display Name', value: target.displayName, inline: true },
        { name: '⏱️ Timed Out', value: target.isCommunicationDisabled() ? `Until <t:${Math.floor(target.communicationDisabledUntilTimestamp / 1000)}:R>` : 'No', inline: true },
        { name: '🏅 Badges', value: badges, inline: true },
        { name: `🔰 Roles [${roles.size}]`, value: topRoles.slice(0, 1024) },
      )
      .setImage(user.bannerURL({ size: 1024 }) || null)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
