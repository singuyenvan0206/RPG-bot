const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

function generateGuildId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = {
    category: 'Community',
    aliases: ['g', 'clan'],
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Hệ thống Quản lý Bang Hội')
        .addSubcommand(sub => 
            sub.setName('create')
            .setDescription('Tạo một Bang Hội mới (Cần Cấp 50 và 10,000 Vàng)')
            .addStringOption(opt => 
                opt.setName('name')
                .setDescription('Tên Bang Hội (Tối đa 20 ký tự)')
                .setRequired(true)
            )
        )
        .addSubcommand(sub => 
            sub.setName('info')
            .setDescription('Xem thông tin Bang Hội hiện tại của bạn')
        )
        .addSubcommand(sub => 
            sub.setName('join')
            .setDescription('Gia nhập một Bang Hội qua Mã ID')
            .addStringOption(opt => 
                opt.setName('guild_id')
                .setDescription('Mã ID gồm 6 ký tự của Bang Hội')
                .setRequired(true)
            )
        )
        .addSubcommand(sub => 
            sub.setName('leave')
            .setDescription('Rời khỏi Bang Hội hiện tại')
        )
        .addSubcommand(sub => 
            sub.setName('donate')
            .setDescription('Đóng góp Vàng vào Quỹ Bang Hội')
            .addIntegerOption(opt => 
                opt.setName('amount')
                .setDescription('Số lượng Vàng muốn đóng góp')
                .setRequired(true)
            )
        )
        .addSubcommand(sub => 
            sub.setName('territory')
            .setDescription('Xem bản đồ Lãnh Địa Bang Hội và Quyền Sỡ Hữu')
        )
        .addSubcommand(sub => 
            sub.setName('claim')
            .setDescription('Chiếm đóng vùng đất hiện tại (Tốn 50,000 - 100,000 Quỹ Bang)')
        ),
    help: {
        usage: '/guild <lệnh con>',
        examples: ['/guild create HộiPhápSư', '/guild join AB12CD', '/guild info'],
        description: 'Hệ thống cốt lõi để kết nối người chơi. Tham gia Bang hội để cùng nhau phát triển và nhận các phần thưởng tập thể trong tương lai!'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);

        if (!player) {
            return interaction.reply({ content: '❌ Bạn cần tạo nhân vật trước (`/start`).', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'create') {
            if (player.guild_id) {
                return interaction.reply({ content: '❌ Bạn đã ở trong một Bang Hội rồi! Vui lòng `/guild leave` trước.', flags: require('discord.js').MessageFlags.Ephemeral });
            }
            if (player.level < 50) {
                return interaction.reply({ content: '❌ Bạn cần đạt ít nhất **Cấp 50** để thành lập Bang Hội.', flags: require('discord.js').MessageFlags.Ephemeral });
            }
            if (player.gold < 10000) {
                return interaction.reply({ content: '❌ Bạn cần **10,000 Vàng** để đóng lệ phí thành lập Bang Hội.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const name = interaction.options.getString('name').trim();
            if (name.length > 20 || name.length < 3) {
                return interaction.reply({ content: '❌ Tên Bang Hội phải từ 3 đến 20 ký tự.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Check name duplicate
            const nameCheck = await db.queryOne('SELECT guild_id FROM guilds WHERE LOWER(name) = LOWER($1)', [name]);
            if (nameCheck) {
                return interaction.reply({ content: '❌ Tên Bang này đã có người đăng ký!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const newId = generateGuildId();
            
            // Deduct gold & Create Guild
            await db.execute('UPDATE players SET gold = gold - 10000 WHERE user_id = $1', [userId]);
            await db.execute(
                'INSERT INTO guilds (guild_id, name, owner_id) VALUES ($1, $2, $3)',
                [newId, name, userId]
            );
            // Assign player to guild
            await db.execute('UPDATE players SET guild_id = $1 WHERE user_id = $2', [newId, userId]);

            const embed = new EmbedBuilder()
                .setTitle('🏰 Thành Lập Bang Hội Thành Công!')
                .setColor('#2ecc71')
                .setDescription(`Chúc mừng **<@${userId}>** đã chính thức thành lập Bang **${name}**!`)
                .addFields(
                    { name: '🔖 Mã Mời (Guild ID)', value: `\`${newId}\``, inline: true },
                    { name: '👑 Chủ Bang', value: `<@${userId}>`, inline: true }
                )
                .setFooter({ text: 'Hãy chia sẻ Mã Mời này cho bạn bè để chiêu mộ họ nhé!' });

            return interaction.reply({ embeds: [embed] });
        }

        if (subCmd === 'info') {
            if (!player.guild_id) {
                return interaction.reply({ content: '❌ Bạn chưa tham gia Bang Hội nào. Gõ `/guild join <ID>` hoặc `/guild create`.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            if (!guild) {
                // Failsafe if guild was deleted
                await db.execute('UPDATE players SET guild_id = NULL WHERE user_id = $1', [userId]);
                return interaction.reply({ content: '❌ Bang Hội của bạn dường như đã giải tán.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Count members
            const memberCountRes = await db.queryOne('SELECT COUNT(*) as count FROM players WHERE guild_id = $1', [guild.guild_id]);
            const count = memberCountRes ? parseInt(memberCountRes.count) : 1;

            const embed = new EmbedBuilder()
                .setTitle(`🏰 Bang Hội: ${guild.name}`)
                .setColor('#3498db')
                .addFields(
                    { name: '🔖 ID Bang', value: `\`${guild.guild_id}\``, inline: true },
                    { name: '👑 Bang Chủ', value: `<@${guild.owner_id}>`, inline: true },
                    { name: '📈 Cấp Độ Bang', value: `Lv. ${guild.level}`, inline: true },
                    { name: '👥 Thành Viên', value: `${count} người`, inline: true },
                    { name: '🪙 Quỹ Vàng', value: `${parseInt(guild.gold).toLocaleString()} 🪙`, inline: true },
                    { name: '🌟 Kinh Nghiệm Bang', value: `${parseInt(guild.exp).toLocaleString()} EXP`, inline: true }
                )
                .setFooter({ text: 'Hội cùng chung chí hướng, vượt ngàn chông gai!' });

            return interaction.reply({ embeds: [embed] });
        }

        if (subCmd === 'join') {
            if (player.guild_id) {
                return interaction.reply({ content: '❌ Bạn đã ở trong một Bang Hội rồi! Vui lòng `/guild leave` trước.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const joinId = interaction.options.getString('guild_id').trim().toUpperCase();
            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [joinId]);

            if (!guild) {
                return interaction.reply({ content: `❌ Không tìm thấy Bang Hội nào với ID \`${joinId}\`.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Check Member capacity (e.g., Level * 10 members limit)
            const maxMembers = guild.level * 10;
            const memberCountRes = await db.queryOne('SELECT COUNT(*) as count FROM players WHERE guild_id = $1', [guild.guild_id]);
            const currentMembers = memberCountRes ? parseInt(memberCountRes.count) : 0;

            if (currentMembers >= maxMembers) {
                return interaction.reply({ content: `❌ Bang **${guild.name}** đã đạt giới hạn thành viên (${maxMembers}/${maxMembers}).`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET guild_id = $1 WHERE user_id = $2', [joinId, userId]);

            return interaction.reply({ content: `✅ Bạn đã chính thức gia nhập Bang **${guild.name}**! Gõ \`/guild info\` để xem tổng quan.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        if (subCmd === 'leave') {
            if (!player.guild_id) {
                return interaction.reply({ content: '❌ Bạn chưa tham gia Bang Hội nào để rời đi.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            if (guild && guild.owner_id === userId) {
                return interaction.reply({ content: '❌ Bạn là Chủ Bang! Bạn không thể rời bang lúc này (Tính năng nhường chức đang bảo trì, nếu bạn muốn, hãy giải tán bang... mà tôi chưa code lệnh đó đâu).', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET guild_id = NULL WHERE user_id = $1', [userId]);
            
            return interaction.reply({ content: `👋 Bạn đã rời khỏi Bang **${guild ? guild.name : 'Vô Danh'}**.`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        if (subCmd === 'donate') {
            if (!player.guild_id) {
                return interaction.reply({ content: '❌ Bạn cần ở trong một Bang Hội để đóng góp.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const amount = interaction.options.getInteger('amount');
            if (amount <= 0 || player.gold < amount) {
                return interaction.reply({ content: '❌ Số vàng đóng góp không hợp lệ hoặc bạn không đủ vàng.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [amount, userId]);
            await db.execute('UPDATE guilds SET gold = gold + $1 WHERE guild_id = $2', [amount, player.guild_id]);

            return interaction.reply({ content: `🎉 Cảm ơn tấm lòng của bạn! Bạn đã hiến tặng **${amount.toLocaleString()} 🪙** vào Quỹ Bang Hội.` });
        }

        if (subCmd === 'territory') {
            const rpgData = require('../../utils/rpgData');
            const regions = Object.keys(rpgData);
            
            const embed = new EmbedBuilder()
                .setTitle('🗺️ Bản Đồ Lãnh Địa Bang Hội')
                .setColor('#9b59b6')
                .setDescription('Bang hội sở hữu lãnh địa sẽ được **x2 lợi ích từ Region Buff** của vùng đó!');

            for (const r of regions) {
                const regionName = rpgData[r].name;
                const ownerState = await db.queryOne("SELECT value FROM world_states WHERE key = $1", [`territory_${r}`]);
                let ownerText = 'Trống (Miễn phí)';
                if (ownerState) {
                    const ownerGuild = await db.queryOne("SELECT name FROM guilds WHERE guild_id = $1", [ownerState.value]);
                    if (ownerGuild) ownerText = `🏰 Bang: **${ownerGuild.name}**`;
                }
                embed.addFields({ name: regionName, value: ownerText, inline: true });
            }
            return interaction.reply({ embeds: [embed] });
        }

        if (subCmd === 'claim') {
            if (!player.guild_id) {
                return interaction.reply({ content: '❌ Bạn chưa tham gia Bang Hội nào.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            if (guild.owner_id !== userId) {
                return interaction.reply({ content: '❌ Chỉ Bang Chủ mới có quyền phát động Chiếm Đóng Lãnh Địa!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Check if current region is already owned
            const regionId = player.current_region;
            const rpgData = require('../../utils/rpgData');
            const regionName = rpgData[regionId].name;

            const ownerState = await db.queryOne("SELECT value FROM world_states WHERE key = $1", [`territory_${regionId}`]);
            if (ownerState && ownerState.value === guild.guild_id) {
                return interaction.reply({ content: `❌ Bang của bạn đã sở hữu **${regionName}** rồi.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Target price
            let cost = 50000;
            if (ownerState) cost = 100000; // Chiếm của bang khác đắt gấp đôi

            if (guild.gold < cost) {
                return interaction.reply({ content: `❌ Quỹ bang không đủ! Yêu cầu **${cost.toLocaleString()} 🪙** để chiếm đóng ${ownerState ? '(Bao gồm phí tuyên chiến)' : ''}.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Deduct guild gold
            await db.execute('UPDATE guilds SET gold = gold - $1 WHERE guild_id = $2', [cost, guild.guild_id]);
            
            // Set territory
            await db.execute(
                "INSERT INTO world_states (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
                [`territory_${regionId}`, guild.guild_id]
            );

            return interaction.reply({ content: `🎉 **TUYÊN CÁO LÃNH ĐỊA!**\nBang chủ <@${userId}> đã chi **${cost.toLocaleString()} 🪙** để cắm cờ Bang **${guild.name}** tại **${regionName}**! Toàn bộ thành viên sẽ được x2 hiệu ứng Region Buff tại đây.` });
        }
    }
};
