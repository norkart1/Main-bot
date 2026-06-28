const { db, admin } = require('./firebase');

async function logModAction({ guildId, action, moderatorId, moderatorTag, targetId, targetTag, reason }) {
  await db.collection('modActions').add({
    guildId,
    action,
    moderatorId,
    moderatorTag: moderatorTag || 'System',
    targetId: targetId || null,
    targetTag: targetTag || null,
    reason: reason || 'No reason provided',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function addWarning({ guildId, targetId, targetTag, moderatorId, moderatorTag, reason }) {
  const ref = await db.collection('warnings').add({
    guildId,
    targetId,
    targetTag,
    moderatorId,
    moderatorTag,
    reason,
    active: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function getWarnings(guildId, targetId) {
  const snap = await db
    .collection('warnings')
    .where('guildId', '==', guildId)
    .where('targetId', '==', targetId)
    .orderBy('timestamp', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function clearWarnings(guildId, targetId) {
  const snap = await db
    .collection('warnings')
    .where('guildId', '==', guildId)
    .where('targetId', '==', targetId)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  const total = val * ms;
  if (total < 5000 || total > 28 * 24 * 3600000) return null;
  return total;
}

module.exports = { logModAction, addWarning, getWarnings, clearWarnings, parseDuration };
