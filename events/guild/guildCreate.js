const { syncGuild } = require('../../models/Guild');

module.exports = {
  name: 'guildCreate',
  async execute(client, guild) {
    try {
      await syncGuild(guild);
      console.log(`Bot added to new guild: ${guild.name}`);
    } catch (err) {
      console.error('guildCreate error:', err.message);
    }
  },
};
