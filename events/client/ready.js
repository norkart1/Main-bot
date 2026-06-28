const { ActivityType, EmbedBuilder } = require('discord.js');
const { syncGuild, syncChannels } = require('../../models/Guild');
const { db, admin } = require('../../services/firebase');
const { logModAction } = require('../../services/modActions');
const { parseDuration } = require('../../services/modActions');

async function executeDashboardAction(client, docId, data) {
  const ref = db.collection('pendingActions').doc(docId);
  try {
    const guild = client.guilds.cache.get(data.guildId);
    if (!guild) throw new Error('Guild not found');

    let resultMsg = 'Action executed';

    switch (data.action) {
      case 'ban': {
        await guild.members.ban(data.targetId, { reason: data.reason || 'Banned from dashboard' });
        resultMsg = `Banned ${data.targetTag}`;
        break;
      }
      case 'unban': {
        await guild.members.unban(data.targetId, data.reason || 'Unbanned from dashboard');
        resultMsg = `Unbanned ${data.targetId}`;
        break;
      }
      case 'kick': {
        const member = guild.members.cache.get(data.targetId) || await guild.members.fetch(data.targetId).catch(() => null);
        if (!member) throw new Error('Member not found');
        await member.kick(data.reason || 'Kicked from dashboard');
        resultMsg = `Kicked ${data.targetTag}`;
        break;
      }
      case 'timeout': {
        const member = guild.members.cache.get(data.targetId) || await guild.members.fetch(data.targetId).catch(() => null);
        if (!member) throw new Error('Member not found');
        const ms = data.duration ? parseDuration(data.duration) : 10 * 60 * 1000;
        await member.timeout(ms || 10 * 60 * 1000, data.reason || 'Timed out from dashboard');
        resultMsg = `Timed out ${data.targetTag}`;
        break;
      }
      case 'untimeout': {
        const member = guild.members.cache.get(data.targetId) || await guild.members.fetch(data.targetId).catch(() => null);
        if (!member) throw new Error('Member not found');
        await member.timeout(null, data.reason || 'Timeout removed from dashboard');
        resultMsg = `Removed timeout for ${data.targetTag}`;
        break;
      }
      default:
        throw new Error(`Unknown action: ${data.action}`);
    }

    await logModAction({ guildId: data.guildId, action: data.action, moderatorId: 'dashboard', moderatorTag: data.moderatorTag || 'Dashboard', targetId: data.targetId, targetTag: data.targetTag, reason: data.reason });
    await ref.update({ status: 'done', result: resultMsg, completedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`✅ Dashboard action [${data.action}] on ${data.targetTag}: ${resultMsg}`);
  } catch (err) {
    console.error(`❌ Dashboard action [${data.action}] failed:`, err.message);
    await ref.update({ status: 'error', error: err.message, completedAt: admin.firestore.FieldValue.serverTimestamp() }).catch(() => {});
  }
}

const TYPE_MAP = {
  PLAYING: ActivityType.Playing,
  WATCHING: ActivityType.Watching,
  LISTENING: ActivityType.Listening,
  COMPETING: ActivityType.Competing,
};

function applyStatus(client, type, text) {
  const activityType = TYPE_MAP[type] ?? ActivityType.Watching;
  client.user.setActivity(text, { type: activityType });
  console.log(`🎮 Status set: ${type} ${text}`);
}

async function applyProfile(client, data) {
  const edits = {};
  if (data.avatar) edits.avatar = data.avatar;
  if (data.banner) edits.banner = data.banner;
  if (data.bio !== undefined) edits.bio = data.bio;
  if (Object.keys(edits).length === 0) return;

  try {
    await client.user.edit(edits);
    if (edits.avatar) console.log('🖼️  Avatar updated');
    if (edits.banner) console.log('🖼️  Banner updated');
    if (edits.bio !== undefined) console.log('📝  Bio updated');
  } catch (err) {
    if (err.code === 50035 || err.message?.includes('banner')) {
      const fallback = {};
      if (edits.avatar) fallback.avatar = edits.avatar;
      if (edits.bio !== undefined) fallback.bio = edits.bio;
      if (Object.keys(fallback).length > 0) {
        try {
          await client.user.edit(fallback);
          if (fallback.avatar) console.log('🖼️  Avatar updated (banner skipped — requires verified bot)');
          if (fallback.bio !== undefined) console.log('📝  Bio updated');
        } catch (e2) {
          console.error('Profile update failed:', e2.message);
        }
      } else {
        console.warn('⚠️  Banner update skipped: requires a verified/partnered bot');
      }
    } else {
      console.error('Profile update error:', err.message);
    }
  }
}

async function sendAnnouncement(client, docId, data) {
  const guild = client.guilds.cache.get(data.guildId);
  if (!guild) {
    console.warn(`⚠️  Announcement ${docId}: guild ${data.guildId} not in cache`);
    await db.collection('announcements').doc(docId).update({ status: 'error', error: 'Guild not found' });
    return;
  }

  try {
    await guild.channels.fetch();
  } catch (_) {}

  let targetChannel = null;

  if (data.channelId) {
    targetChannel = guild.channels.cache.get(data.channelId);
  }

  if (!targetChannel) {
    targetChannel = guild.channels.cache.find(
      (ch) =>
        ch.isTextBased() &&
        !ch.isThread() &&
        (ch.type === 5 ||
          ch.name === 'announcements' ||
          ch.name === 'announcement' ||
          ch.name === 'general')
    );
  }

  if (!targetChannel) {
    console.warn(`⚠️  Announcement ${docId}: no suitable channel in ${guild.name}`);
    await db.collection('announcements').doc(docId).update({ status: 'error', error: 'No announcement channel found' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(data.header)
    .setDescription(data.content)
    .setTimestamp();

  const files = [];

  if (data.imageUrl) {
    if (data.imageUrl.startsWith('http://') || data.imageUrl.startsWith('https://')) {
      embed.setImage(data.imageUrl);
    } else if (data.imageUrl.startsWith('data:image/')) {
      const matches = data.imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        files.push({ attachment: buffer, name: `announcement.${ext}` });
        embed.setImage(`attachment://announcement.${ext}`);
      }
    }
  }

  if (data.sender) {
    embed.setFooter({ text: `Sent by ${data.sender}` });
  }

  try {
    await targetChannel.send({ embeds: [embed], files });
    await db.collection('announcements').doc(docId).update({ status: 'sent', sentAt: new Date() });
    console.log(`📢  Announcement sent to #${targetChannel.name} in ${guild.name}`);
  } catch (err) {
    console.error(`Announcement send error (${docId}):`, err.message);
    await db.collection('announcements').doc(docId).update({ status: 'error', error: err.message });
  }
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} guild(s)`);

    for (const guild of client.guilds.cache.values()) {
      try {
        const full = await guild.fetch();
        await syncGuild(full);
        await syncChannels(full);
        console.log(`  Synced guild: ${full.name}`);
      } catch (err) {
        console.error(`  Failed to sync guild ${guild.id}:`, err.message);
      }
    }

    // ── Bot Status listener ────────────────────────────────────────
    try {
      const statusSnap = await db.collection('botConfig').doc('status').get();
      if (statusSnap.exists) {
        const { type, text } = statusSnap.data();
        applyStatus(client, type, text);
      } else {
        applyStatus(client, 'WATCHING', 'your server 👀');
      }
    } catch {
      applyStatus(client, 'WATCHING', 'your server 👀');
    }

    db.collection('botConfig').doc('status').onSnapshot(
      (snap) => {
        if (!snap.exists) return;
        const { type, text } = snap.data();
        applyStatus(client, type, text);
      },
      (err) => console.error('Status listener error:', err.message)
    );

    // ── Bot Profile + Bio listener ─────────────────────────────────
    let lastProfileUpdate = 0;
    db.collection('botConfig').doc('profile').onSnapshot(
      async (snap) => {
        if (!snap.exists) return;
        const data = snap.data();
        const updatedAt = Math.max(
          data.avatarUpdatedAt?.toMillis?.() || 0,
          data.bannerUpdatedAt?.toMillis?.() || 0,
          data.bioUpdatedAt?.toMillis?.() || 0
        );
        if (updatedAt > lastProfileUpdate && lastProfileUpdate !== 0) {
          lastProfileUpdate = updatedAt;
          await applyProfile(client, data);
        } else {
          lastProfileUpdate = updatedAt || Date.now();
        }
      },
      (err) => console.error('Profile listener error:', err.message)
    );

    // ── Dashboard moderation action listener ───────────────────────
    const processedActions = new Set();

    db.collection('pendingActions')
      .where('status', '==', 'pending')
      .onSnapshot(
        async (snap) => {
          for (const change of snap.docChanges()) {
            if (change.type !== 'added' && change.type !== 'modified') continue;
            const docId = change.doc.id;
            if (processedActions.has(docId)) continue;
            processedActions.add(docId);
            const data = change.doc.data();
            await executeDashboardAction(client, docId, data);
          }
        },
        (err) => console.error('Dashboard action listener error:', err.message)
      );

    // ── Announcement listener ──────────────────────────────────────
    const processedAnnouncements = new Set();

    db.collection('announcements')
      .where('status', '==', 'pending')
      .onSnapshot(
        async (snap) => {
          for (const change of snap.docChanges()) {
            if (change.type === 'added' || change.type === 'modified') {
              const docId = change.doc.id;
              if (processedAnnouncements.has(docId)) continue;
              processedAnnouncements.add(docId);
              const data = change.doc.data();
              await sendAnnouncement(client, docId, data);
            }
          }
        },
        (err) => console.error('Announcement listener error:', err.message)
      );
  },
};
