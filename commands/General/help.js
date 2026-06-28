const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const CATEGORIES = {
  general: {
    label: '📋 General',
    description: 'Basic bot commands',
    color: 0x5865f2,
    commands: [
      { name: '/ping', desc: 'Check bot latency and uptime' },
      { name: '/stats', desc: "Show today's server stats (messages, joins, leaves)" },
      { name: '/serverinfo', desc: 'Show detailed info about this server' },
      { name: '/userinfo [user]', desc: 'Show detailed info about a user' },
      { name: '/help', desc: 'Show this help menu' },
    ],
  },
  ai: {
    label: '🤖 AI (Grok)',
    description: 'AI-powered commands',
    color: 0xeb459e,
    commands: [
      { name: '/ai ask <question>', desc: 'Ask Grok AI anything — facts, code, creative writing' },
      { name: '/ai image <prompt>', desc: 'Generate an image using Grok AI' },
    ],
  },
  moderation: {
    label: '🛡️ Moderation',
    description: 'Server moderation tools',
    color: 0xed4245,
    commands: [
      { name: '/ban <user> [reason]', desc: 'Ban a user from the server' },
      { name: '/unban <user_id>', desc: 'Unban a user by ID' },
      { name: '/kick <user> [reason]', desc: 'Kick a member' },
      { name: '/timeout <user> <duration>', desc: 'Timeout a member (e.g. 5m, 1h, 1d)' },
      { name: '/untimeout <user>', desc: 'Remove a timeout from a member' },
      { name: '/warn <user> <reason>', desc: 'Warn a member (stored + DM sent)' },
      { name: '/warnings <user>', desc: "View a member's warnings" },
      { name: '/clearwarnings <user>', desc: "Clear all warnings for a member" },
      { name: '/purge <amount>', desc: 'Bulk delete up to 100 messages' },
      { name: '/slowmode <seconds>', desc: 'Set channel slowmode (0 to disable)' },
    ],
  },
  server: {
    label: '⚙️ Server Control',
    description: 'Channel and role management',
    color: 0xfee75c,
    commands: [
      { name: '/lock [channel]', desc: 'Lock a channel — stop members from sending' },
      { name: '/unlock [channel]', desc: 'Unlock a channel' },
      { name: '/setnick <user> [nick]', desc: 'Change or reset a member\'s nickname' },
      { name: '/role add <user> <role>', desc: 'Add a role to a member' },
      { name: '/role remove <user> <role>', desc: 'Remove a role from a member' },
      { name: '/move <user> <channel>', desc: 'Move a user to a voice channel' },
      { name: '/deafen <user>', desc: 'Server-deafen a member in voice' },
      { name: '/undeafen <user>', desc: 'Undeafen a member in voice' },
      { name: '/automod', desc: 'Configure AI auto-moderation settings' },
      { name: '/announcement', desc: 'Open the dashboard to send an announcement' },
    ],
  },
};

function buildEmbed(catKey) {
  const cat = CATEGORIES[catKey];
  return new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.label} Commands`)
    .setDescription(cat.commands.map((c) => `\`${c.name}\`\n↳ ${c.desc}`).join('\n\n'))
    .setFooter({ text: 'NorkcCraft Bot • Use the menu below to switch categories' })
    .setTimestamp();
}

function buildRow(selected) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('Choose a category…')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, cat]) => ({
          label: cat.label,
          description: cat.description,
          value: key,
          default: key === selected,
        }))
      )
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands')
    .addStringOption((o) =>
      o.setName('category')
        .setDescription('Jump to a specific category')
        .addChoices(
          { name: '📋 General', value: 'general' },
          { name: '🤖 AI (Grok)', value: 'ai' },
          { name: '🛡️ Moderation', value: 'moderation' },
          { name: '⚙️ Server Control', value: 'server' },
        )
    ),

  async execute(interaction, client) {
    const startCat = interaction.options.getString('category') || 'general';
    const embed = buildEmbed(startCat);
    const row = buildRow(startCat);

    await interaction.reply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.customId === 'help_category' && i.user.id === interaction.user.id,
      time: 120_000,
    });

    collector.on('collect', async (i) => {
      const cat = i.values[0];
      await i.update({ embeds: [buildEmbed(cat)], components: [buildRow(cat)] });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (_) {}
    });
  },
};
