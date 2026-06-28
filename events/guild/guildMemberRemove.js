const { logActivity, incrementDailyStat, updateMemberCount } = require('../../models/Guild');

module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    try {
      await incrementDailyStat(member.guild.id, 'memberLeaves');
      await updateMemberCount(member.guild);
      await logActivity(
        member.guild.id,
        'leave',
        member.user.id,
        member.user.username,
        `Left the server`
      );
      console.log(`[-] ${member.user.tag} left ${member.guild.name}`);
    } catch (err) {
      console.error('guildMemberRemove error:', err.message);
    }
  },
};
