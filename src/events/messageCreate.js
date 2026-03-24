const { Events } = require('discord.js');
const { getPrefix } = require('../utils/serverConfig');
const { parseAmount } = require('../utils/numberHelper');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        const PREFIX = await getPrefix(message.guild?.id);
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = client.commands.get(commandName);
        
        if (!command && client.aliases.has(commandName)) {
            command = client.commands.get(client.aliases.get(commandName));
        }

        if (!command) return;

        // Custom Mock Interaction Object to route Text Commands through Slash Command Logic
        const mockInteraction = {
            isCommand: () => true,
            isChatInputCommand: () => true,
            isButton: () => false,
            commandName: commandName,
            client: client,
            user: message.author,
            channel: message.channel,
            guild: message.guild,
            options: {
                getSubcommand: (required) => {
                    const baseName = command.data.name;
                    // For shop, always route to 'buy' when args are provided
                    if (baseName === 'shop' && args[0]) return 'buy';
                    return args[0] || null;
                },
                getString: (name) => {
                    const baseName = command.data.name;
                    if (baseName === 'forge' && (name === 'slot' || name === 'slots')) {
                        if (args[0] === '1') return 'weapon';
                        if (args[0] === '2') return 'armor';
                        if (args[0] === '3') return 'accessory';
                        return args[0];
                    }
                    if (baseName === 'dismantle' && (name === 'item_id' || name === 'item_ids')) return args[0];
                    if (baseName === 'equip' && name === 'item_id') return args[0];
                    if (baseName === 'shop' && name === 'item_id') {
                        // $shop buy <id> → args[0]='buy', id at args[1]
                        // $mua <id>      → args[0]=id directly
                        return args[0] === 'buy' ? args[1] : args[0];
                    }
                    if (baseName === 'forge' && name === 'slots') {
                        if (args[0] === '1') return 'weapon';
                        if (args[0] === '2') return 'armor';
                        if (args[0] === '3') return 'accessory';
                        return args[0];
                    }
                    if (baseName === 'market' && name === 'item_id') return args[1];
                    if (baseName === 'item' && name === 'query') return args.join(' ');
                    if (baseName === 'craft' && name === 'recipe_id') return args[0];
                    if (baseName === 'help' && name === 'command') return args[0];
                    if (baseName === 'guild' && name === 'name') return args.slice(1).join(' ');
                    if (baseName === 'guild' && name === 'guild_id') return args[1];
                    if (baseName === 'flip' && name === 'side') return args[1];
                    if (baseName === 'giveitem' && name === 'item_id') return args[1];
                    if (name === 'amount' || name === 'bet' || name === 'price') {
                        // Return raw string for commands that now use getString + parseAmount
                        if (baseName === 'givegold' || baseName === 'slots' || baseName === 'flip') return args[1] || args[0];
                        if (baseName === 'market' && name === 'price') return args[1];
                        if (baseName === 'giveitem' && name === 'amount') return args[2];
                    }
                    return null;
                },
                getInteger: (name) => {
                    const baseName = command.data.name;
                    const parseArgs = (index) => {
                        const val = parseAmount(args[index]);
                        return isNaN(val) ? null : val;
                    };
                    if (baseName === 'pet' && name === 'pet_id') return parseArgs(1);
                    if (baseName === 'market' && name === 'price') return parseArgs(2);
                    if (baseName === 'market' && name === 'listing_id') return parseArgs(1);
                    if (baseName === 'slots' && name === 'bet') return parseArgs(0);
                    if (baseName === 'flip' && name === 'bet') return parseArgs(0);
                    if (baseName === 'shop' && name === 'amount') {
                        // $shop buy <id> [amount] → amount at args[2]
                        // $mua <id> [amount]      → amount at args[1]
                        return args[0] === 'buy' ? parseArgs(2) : parseArgs(1);
                    }
                    if (baseName === 'setlevel' && name === 'level') return parseArgs(1);
                    if (baseName === 'givegold' && name === 'amount') return parseArgs(1);
                    if (baseName === 'giveitem' && name === 'amount') return parseArgs(2);
                    if (baseName === 'craft' && name === 'amount') return parseArgs(1);
                    return null;
                },
                getUser: (name) => {
                    // Support @mention in prefix commands
                    if (name === 'user') {
                        return message.mentions.users.first() || null;
                    }
                    return null;
                },
                getMember: (name) => {
                    if (name === 'user') {
                        return message.mentions.members?.first() || null;
                    }
                    return null;
                },
                getBoolean: () => null,
                getNumber: () => null,
                getChannel: () => null,
                getRole: () => null,
            },
            reply: async (data) => {
                if (typeof data === 'string') return message.reply(data);
                const replyObj = { ...data };
                delete replyObj.ephemeral; 
                delete replyObj.flags;
                return message.reply(replyObj);
            },
            update: async (data) => {
                const replyObj = { ...data };
                delete replyObj.ephemeral; 
                delete replyObj.flags;
                return message.channel.send(replyObj);
            },
            followUp: async (data) => {
                const replyObj = { ...data };
                delete replyObj.ephemeral; 
                delete replyObj.flags;
                return message.reply(replyObj);
            },
            deferReply: async () => {},
            editReply: async (data) => { 
                const replyObj = { ...data };
                delete replyObj.ephemeral; 
                delete replyObj.flags;
                return message.channel.send(replyObj); 
            }
        };

        try {
            await command.execute(mockInteraction);
        } catch (error) {
            console.error('[Command Error]:', error);
            if (error.code === 'MODULE_NOT_FOUND' && error.requireStack) {
                console.error('[Require Stack]:', error.requireStack);
            }
            
            if (typeof message.reply === 'function') {
                try {
                    await message.reply('Có lỗi xảy ra khi thực hiện lệnh này!');
                } catch (replyError) {
                    console.error('[Reply Error]:', replyError);
                }
            } else {
                console.error('[Error]: message.reply is not a function');
            }
        }
    },
};
