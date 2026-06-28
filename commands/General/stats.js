const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../services/firebase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription("Show this server's stats"),
  async execute(interaction, client) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const date = new Date().toISOString().split('T')[0];

    let messages = 0;
    let joins = 0;
    let leaves = 0;

    try {
      const snap = await db
        .collection('guilds')
        .doc(guild.id)
        .collection('dailyStats')
        .doc(date)
        .get();
      if (snap.exists) {
        const data = snap.data();
        messages = data.messageCount || 0;
        joins = data.memberJoins || 0;
        leaves = data.memberLeaves || 0;
      }
    } catch (_) {}

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${guild.name} — Today's Stats`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '👥 Total Members', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Messages Today', value: `${messages}`, inline: true },
        { name: '📥 Joins Today', value: `${joins}`, inline: true },
        { name: '📤 Leaves Today', value: `${leaves}`, inline: true }
      )
      .setFooter({ text: `Date: ${date}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
