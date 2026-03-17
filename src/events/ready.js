const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`[EchoWorld] Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('EchoWorld RPG | /start', { type: 0 });
    },
};
