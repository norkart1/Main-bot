const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { getWarnings } = require('../../services/modActions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a member\'s warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user');

    try {
      const warns = await getWarnings(interaction.guild.id, target.id);
      if (!warns.length) return interaction.editReply({ content: `✅ **${target.tag}** has no warnings.` });

      const embed = new EmbedBuilder().setColor(0xfee75c).setTitle(`⚠️ Warnings for ${target.tag}`)
        .setDescription(warns.slice(0, 10).map((w, i) => {
          const date = w.timestamp?.toDate ? w.timestamp.toDate().toDateString() : 'Unknown date';
          return `**${i + 1}.** ${w.reason}\n> By: ${w.moderatorTag} • ${date}`;
        }).join('\n\n'))
        .setFooter({ text: `Total: ${warns.length} warning(s)` }).setTimestamp();

      await interaction.editReply({ embeds: [embed], flags: 0 });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
