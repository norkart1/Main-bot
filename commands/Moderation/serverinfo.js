const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];
const explicitFilters = ['Off', 'Media from members without a role', 'All media'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed information about this server'),

  async execute(interaction) {
    await interaction.deferReply();
    const g = interaction.guild;
    await g.fetch();

    const channels = g.channels.cache;
    const text = channels.filter((c) => c.type === 0).size;
    const voice = channels.filter((c) => c.type === 2).size;
    const categories = channels.filter((c) => c.type === 4).size;
    const roles = g.roles.cache.size - 1;
    const emojis = g.emojis.cache.size;
    const boosts = g.premiumSubscriptionCount || 0;
    const boostTier = g.premiumTier;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 ${g.name}`)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: '🆔 Server ID', value: g.id, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
        { name: '🔰 Roles', value: `${roles}`, inline: true },
        { name: '😀 Emojis', value: `${emojis}`, inline: true },
        { name: '💬 Text', value: `${text}`, inline: true },
        { name: '🔊 Voice', value: `${voice}`, inline: true },
        { name: '📁 Categories', value: `${categories}`, inline: true },
        { name: '🚀 Boosts', value: `${boosts} (Tier ${boostTier})`, inline: true },
        { name: '🛡️ Verification', value: verificationLevels[g.verificationLevel] || 'Unknown', inline: true },
        { name: '🔞 Explicit Filter', value: explicitFilters[g.explicitContentFilter] || 'Unknown', inline: true },
      )
      .setImage(g.bannerURL({ size: 1024 }) || null)
      .setFooter({ text: `Region: ${g.preferredLocale}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
