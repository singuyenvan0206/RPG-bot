const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.commands = new Collection();
client.aliases = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => client.aliases.set(alias, command.data.name));
                }
                console.log(`[Command] Loaded: /${command.data.name}`);
            }
        }
    }
};
loadCommands(commandsPath);

// Load Events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[Event] Loaded: ${event.name}`);
    }
}

// Start Bot
async function start() {
    try {
        await db.initSchema();
        client.login(process.env.DISCORD_TOKEN);
        
        client.once('clientReady', () => {
            console.log(`[Bot] Logged in as ${client.user.tag}`);
            const { startScheduler } = require('./utils/scheduler');
            startScheduler(client);
        });
    } catch (err) {
        console.error('Failed to start bot:', err);
    }
}

start();
