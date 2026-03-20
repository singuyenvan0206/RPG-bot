const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'RPG',
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Quản lý và xem thông tin Bang Hội')
        .addSubcommand(sub => sub.setName('info').setDescription('Xem thông tin Bang Hội').addStringOption(opt => opt.setName('name').setDescription('Tên bang hội')))
        .addSubcommand(sub => sub.setName('create').setDescription('Tạo Bang Hội mới (10,000 Gold)').addStringOption(opt => opt.setName('name').setDescription('Tên bang hội').setRequired(true)))
        .addSubcommand(sub => sub.setName('join').setDescription('Gia nhập Bang Hội').addStringOption(opt => opt.setName('name').setDescription('Tên bang hội').setRequired(true)))
        .addSubcommand(sub => sub.setName('leave').setDescription('Rời khỏi Bang Hội'))
        .addSubcommand(sub => sub.setName('territory').setDescription('Xem bản đồ chiếm đóng')),
    async execute(interaction) {
        const userId = interaction.user.id;
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            const name = interaction.options.getString('name');
            const player = await db.getPlayer(userId);
            if (player.guild_id) return interaction.reply({ content: 'Bạn đã ở trong một bang hội rồi!', flags: 64 });
            if (player.gold < 10000) return interaction.reply({ content: 'Bạn không đủ 10,000 Gold!', flags: 64 });

            try {
                const guildId = `g_${Date.now()}`;
                await db.execute('INSERT INTO guilds (guild_id, name, owner_id) VALUES ($1, $2, $3)', [guildId, name, userId]);
                await db.execute('UPDATE players SET gold = gold - 10000, guild_id = $1 WHERE user_id = $2', [guildId, userId]);
                return interaction.reply({ content: `✅ Chúc mừng! Bạn đã thành lập Bang Hội **${name}**!` });
            } catch (e) {
                return interaction.reply({ content: '❌ Tên bang hội đã tồn tại hoặc có lỗi xảy ra.', flags: 64 });
            }
        }

        if (sub === 'join') {
            const name = interaction.options.getString('name');
            const guild = await db.queryOne('SELECT * FROM guilds WHERE name = $1', [name]);
            if (!guild) return interaction.reply({ content: '❌ Không tìm thấy bang hội này.', flags: 64 });

            const player = await db.getPlayer(userId);
            if (player.guild_id) return interaction.reply({ content: 'Bạn đã ở trong một bang hội rồi!', flags: 64 });

            await db.execute('UPDATE players SET guild_id = $1 WHERE user_id = $2', [guild.guild_id, userId]);
            return interaction.reply({ content: `✅ Bạn đã gia nhập Bang Hội **${guild.name}**!` });
        }

        if (sub === 'info') {
            const name = interaction.options.getString('name');
            let guild;
            if (name) {
                guild = await db.queryOne('SELECT * FROM guilds WHERE name = $1', [name]);
            } else {
                const player = await db.getPlayer(userId);
                if (!player.guild_id) return interaction.reply({ content: 'Bạn chưa tham gia bang hội nào. Hãy dùng `/guild join` hoặc `/guild create`.', flags: 64 });
                guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            }

            if (!guild) return interaction.reply({ content: '❌ Không tìm thấy bang hội.', flags: 64 });

            const members = await db.query('SELECT user_id, level, exp FROM players WHERE guild_id = $1 ORDER BY level DESC', [guild.guild_id]);
            const totalExp = members.reduce((sum, m) => sum + Number(m.exp), 0);

            const embed = new EmbedBuilder()
                .setTitle(`🛡️ Bang Hội: ${guild.name}`)
                .setColor('#3498db')
                .addFields(
                    { name: 'Chủ Bang', value: `<@${guild.owner_id}>`, inline: true },
                    { name: 'Cấp độ', value: `${guild.level}`, inline: true },
                    { name: 'Thành viên', value: `${members.length}/20`, inline: true },
                    { name: 'Tổng EXP', value: `${totalExp.toLocaleString()}`, inline: true }
                )
                .setDescription(`**Thành viên tiêu biểu:**\n` + members.slice(0, 5).map(m => `<@${m.user_id}> (Lv.${m.level})`).join('\n'));

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'territory') {
            const territories = await db.query('SELECT t.region_id, g.name as guild_name FROM guild_territories t LEFT JOIN guilds g ON t.guild_id = g.guild_id');
            const rpgData = require('../../utils/rpgData');
            
            let list = '';
            for (const key in rpgData) {
                if (typeof rpgData[key] !== 'object' || !rpgData[key].name) continue;
                const owner = territories.find(t => t.region_id === key);
                list += `📍 **${rpgData[key].name}**: ${owner ? `🏰 ${owner.guild_name}` : '🏳️ *Trống*'}\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🗺️ Bản Đồ Chiếm Đóng')
                .setDescription(list || 'Chưa có vùng đất nào bị chiếm đóng.')
                .setColor('#2ecc71')
                .setFooter({ text: 'Tiêu diệt Boss để khẳng định chủ quyền cho Bang Hội của bạn!' });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'leave') {
            const player = await db.getPlayer(userId);
            if (!player.guild_id) return interaction.reply({ content: 'Bạn không ở trong bang hội nào.', flags: 64 });
            
            await db.execute('UPDATE players SET guild_id = NULL WHERE user_id = $1', [userId]);
            return interaction.reply({ content: '✅ Bạn đã rời khỏi bang hội.' });
        }
    },
};
