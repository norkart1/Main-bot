const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

module.exports = async (client) => {
  client.commands = new Collection();
  const commands = [];

  const categories = fs.readdirSync(path.join(__dirname, '../commands'));
  for (const category of categories) {
    const files = fs
      .readdirSync(path.join(__dirname, '../commands', category))
      .filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(__dirname, '../commands', category, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON ? command.data.toJSON() : command.data);
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    console.log(`Registering ${commands.length} slash command(s) globally...`);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('Slash commands registered globally.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
};
