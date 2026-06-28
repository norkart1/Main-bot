const { logActivity, incrementDailyStat } = require('../../models/Guild');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!guildId) return;

    try {
      if (!oldState.channelId && newState.channelId) {
        await incrementDailyStat(guildId, 'voiceJoins');
        await logActivity(
          guildId,
          'voice_join',
          member.user.id,
          member.user.username,
          `Joined #${newState.channel?.name}`
        );
      } else if (oldState.channelId && !newState.channelId) {
        await logActivity(
          guildId,
          'voice_leave',
          member.user.id,
          member.user.username,
          `Left #${oldState.channel?.name}`
        );
      }
    } catch (err) {
      console.error('voiceStateUpdate error:', err.message);
    }
  },
};
