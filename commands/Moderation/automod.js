const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { db, admin } = require('../../services/firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure auto-moderation for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName('status').setDescription('View current automod settings'))
    .addSubcommand((s) => s.setName('toggle')
      .setDescription('Enable or disable a module')
      .addStringOption((o) => o.setName('module').setDescription('Module to toggle').setRequired(true)
        .addChoices(
          { name: 'AI Moderation', value: 'aiMod' },
          { name: 'Spam Links', value: 'spamLinks' },
          { name: 'Rate Limit (fast typing)', value: 'rateLimit' },
        )))
    .addSubcommand((s) => s.setName('logchannel')
      .setDescription('Set a channel to log mod actions')
      .addChannelOption((o) => o.setName('channel').setDescription('Log channel').setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();
    const ref = db.collection('guilds').doc(interaction.guild.id).collection('config').doc('automod');

    if (sub === 'status') {
      const snap = await ref.get();
      const cfg = snap.exists ? snap.data() : {};
      const embed = new EmbedBuilder().setColor(0x5865f2).setTitle('🛡️ AutoMod Settings')
        .addFields(
          { name: '🤖 AI Moderation', value: cfg.aiMod !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🔗 Spam Links', value: cfg.spamLinks !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '⚡ Rate Limit', value: cfg.rateLimit !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '📋 Log Channel', value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : 'Not set', inline: true },
        ).setTimestamp();
      return interaction.editReply({ embeds: [embed], flags: 0 });
    }

    if (sub === 'toggle') {
      const module = interaction.options.getString('module');
      const snap = await ref.get();
      const current = snap.exists ? snap.data()[module] : true;
      await ref.set({ [module]: !current, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return interaction.editReply({ content: `✅ **${module}** is now ${!current ? '✅ Enabled' : '❌ Disabled'}.` });
    }

    if (sub === 'logchannel') {
      const channel = interaction.options.getChannel('channel');
      await ref.set({ logChannelId: channel.id, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return interaction.editReply({ content: `✅ Mod log channel set to ${channel}.` });
    }
  },
};
