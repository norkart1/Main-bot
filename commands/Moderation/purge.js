const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user')),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });
      messages = messages.filter((m) => {
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        return m.createdTimestamp > twoWeeksAgo && (!filterUser || m.author.id === filterUser.id);
      });
      const toDelete = [...messages.values()].slice(0, amount);

      if (!toDelete.length) return interaction.editReply({ content: '❌ No deletable messages found (messages must be under 14 days old).' });

      const deleted = await interaction.channel.bulkDelete(toDelete, true);
      await interaction.editReply({ content: `🗑️ Deleted **${deleted.size}** message(s)${filterUser ? ` from **${filterUser.tag}**` : ''}.` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
