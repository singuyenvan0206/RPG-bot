const { EmbedBuilder } = require('discord.js');

/**
 * Sends a global announcement to the designated broadcast channel.
 * @param {import('discord.js').Client} client 
 * @param {string} title 
 * @param {string} description 
 * @param {string} color 
 */
async function sendGlobal(client, title, description, color = '#f1c40f') {
    const channelId = process.env.BROADCAST_CHANNEL_ID;
    if (!channelId) {
        console.warn('[Broadcast] BROADCAST_CHANNEL_ID not set in .env');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(`🌍 TIN THẾ GIỚI: ${title}`)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }
    } catch (e) {
        console.error('[Broadcast] Failed to send announcement:', e);
    }
}

module.exports = { sendGlobal };
