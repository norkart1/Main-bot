const { logActivity, incrementDailyStat, updateMemberCount } = require('../../models/Guild');

module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    try {
      await incrementDailyStat(member.guild.id, 'memberJoins');
      await updateMemberCount(member.guild);
      await logActivity(
        member.guild.id,
        'join',
        member.user.id,
        member.user.username,
        `Joined the server`
      );
      console.log(`[+] ${member.user.tag} joined ${member.guild.name}`);
    } catch (err) {
      console.error('guildMemberAdd error:', err.message);
    }
  },
};
