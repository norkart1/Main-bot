const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const loadEvents = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        loadEvents(full);
      } else if (entry.name.endsWith('.js')) {
        const event = require(full);
        if (typeof event === 'function') {
          const eventName = entry.name.replace('.js', '');
          client.on(eventName, (...args) => event(client, ...args));
        } else if (event.name && event.execute) {
          const fn = (...args) => event.execute(client, ...args);
          event.once ? client.once(event.name, fn) : client.on(event.name, fn);
        }
      }
    }
  };

  loadEvents(path.join(__dirname, '../events'));
};
