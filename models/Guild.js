const { db, admin } = require('../services/firebase');

const TODAY = () => new Date().toISOString().split('T')[0];

async function syncGuild(guild) {
  const guildRef = db.collection('guilds').doc(guild.id);
  let onlineCount = 0;
  try {
    await guild.members.fetch();
    onlineCount = guild.members.cache.filter(
      (m) => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle'
    ).size;
  } catch (_) {}

  await guildRef.set(
    {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL() || null,
      memberCount: guild.memberCount,
      onlineCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function syncChannels(guild) {
  try {
    await guild.channels.fetch();
  } catch (_) {}

  const channels = guild.channels.cache
    .filter((ch) => ch.isTextBased() && !ch.isThread())
    .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type }))
    .sort((a, b) => a.name.localeCompare(b.name));

  await db.collection('guilds').doc(guild.id).set(
    { channels },
    { merge: true }
  );
}

async function logActivity(guildId, type, userId, username, details = '') {
  const activityRef = db
    .collection('guilds')
    .doc(guildId)
    .collection('recentActivity')
    .doc();

  await activityRef.set({
    type,
    userId,
    username,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  const old = await db
    .collection('guilds')
    .doc(guildId)
    .collection('recentActivity')
    .orderBy('timestamp', 'asc')
    .get();

  if (old.size > 50) {
    const batch = db.batch();
    old.docs.slice(0, old.size - 50).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function incrementDailyStat(guildId, field, amount = 1) {
  const date = TODAY();
  const statRef = db
    .collection('guilds')
    .doc(guildId)
    .collection('dailyStats')
    .doc(date);

  await statRef.set(
    {
      date,
      [field]: admin.firestore.FieldValue.increment(amount),
    },
    { merge: true }
  );
}

async function updateMemberCount(guild) {
  const guildRef = db.collection('guilds').doc(guild.id);
  await guildRef.set(
    {
      memberCount: guild.memberCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

module.exports = { syncGuild, syncChannels, logActivity, incrementDailyStat, updateMemberCount };
