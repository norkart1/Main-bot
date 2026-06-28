const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { incrementDailyStat, logActivity } = require('../../models/Guild');
const { quickCheck, AI_MOD_ENABLED, AI_MOD_MIN_LENGTH } = require('../../config/modConfig');
const { moderateMessage } = require('../../services/grok');

const recentMessages = new Map();
const SPAM_THRESHOLD = 5;
const SPAM_WINDOW_MS = 5000;

function checkRateSpam(userId, guildId) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const times = (recentMessages.get(key) || []).filter((t) => now - t < SPAM_WINDOW_MS);
  times.push(now);
  recentMessages.set(key, times);
  return times.length >= SPAM_THRESHOLD;
}

async function takeAction(message, action, reason) {
  const canDelete = message.channel.permissionsFor(message.guild.members.me)?.has(PermissionFlagsBits.ManageMessages);
  const canTimeout = message.guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers);

  try {
    if (canDelete) await message.delete().catch(() => {});

    const warn = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('⚠️ Message Removed')
      .setDescription(`<@${message.author.id}>, your message was removed.`)
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: 'Auto-Moderation by NorkcCraft Bot' })
      .setTimestamp();

    const notice = await message.channel.send({ embeds: [warn] }).catch(() => null);
    if (notice) setTimeout(() => notice.delete().catch(() => {}), 8000);

    if (action === 'timeout' && canTimeout) {
      await message.member?.timeout(5 * 60 * 1000, reason).catch(() => {});
    }

    await logActivity(
      message.guild.id,
      'moderation',
      message.author.id,
      message.author.username,
      `Auto-mod: ${reason}`
    );

    console.log(`🛡️  [${message.guild.name}] Auto-mod on ${message.author.tag}: ${reason}`);
  } catch (err) {
    console.error('Auto-mod action error:', err.message);
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    try {
      await incrementDailyStat(message.guild.id, 'messageCount');
    } catch (_) {}

    const content = message.content?.trim();
    if (!content || content.length < AI_MOD_MIN_LENGTH) return;

    const member = message.guild.members.cache.get(message.author.id);
    const isAdmin =
      member?.permissions.has(PermissionFlagsBits.Administrator) ||
      member?.permissions.has(PermissionFlagsBits.ManageGuild);
    if (isAdmin) return;

    if (checkRateSpam(message.author.id, message.guild.id)) {
      await takeAction(message, 'delete', 'Sending messages too fast (spam)');
      return;
    }

    const quick = quickCheck(content);
    if (quick) {
      await takeAction(message, quick.action, quick.reason);
      return;
    }

    if (AI_MOD_ENABLED && content.length >= 6) {
      try {
        const result = await moderateMessage(content);
        if (result?.violation) {
          await takeAction(message, result.action || 'delete', result.reason || 'Violated community guidelines');
        }
      } catch (err) {
        console.error('AI moderation error:', err.message);
      }
    }
  },
};
