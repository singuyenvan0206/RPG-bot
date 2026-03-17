const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    aliases: ['g', 'gu'],
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Hệ thống Bang hội EchoWorld')
        .addSubcommand(sub => 
            sub.setName('info')
               .setDescription('Xem thông tin bang hội của bạn')
        )
        .addSubcommand(sub => 
            sub.setName('create')
               .setDescription('Thành lập bang hội mới (Cần 1000 vàng)')
               .addStringOption(opt => opt.setName('name').setDescription('Tên bang hội').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('join')
               .setDescription('Gia nhập một bang hội')
               .addStringOption(opt => opt.setName('guild_id').setDescription('ID của bang hội').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('leave')
               .setDescription('Rời khỏi bang hội hiện tại')
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: require('discord.js').MessageFlags.Ephemeral });

        if (sub === 'info') {
            if (!player.guild_id) return interaction.reply({ content: '❌ Bạn hiện không thuộc bang hội nào.', flags: require('discord.js').MessageFlags.Ephemeral });

            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            const members = await db.queryAll('SELECT user_id, level FROM players WHERE guild_id = $1', [player.guild_id]);

            const embed = new EmbedBuilder()
                .setTitle(`🏰 Bang hội: ${guild.name}`)
                .setColor('#9b59b6')
                .addFields(
                    { name: 'ID Bang Hội', value: `\`${guild.guild_id}\``, inline: true },
                    { name: 'Bang Chủ', value: `<@${guild.owner_id}>`, inline: true },
                    { name: 'Cấp Độ', value: `Lv. ${guild.level}`, inline: true },
                    { name: 'Tài Sản (Quỹ)', value: `🪙 ${guild.gold} Vàng`, inline: true },
                    { name: 'Thành Viên', value: `${members.length} người`, inline: true }
                )
                .setFooter({ text: 'Việc chiến đấu cùng thành viên bang hội mang lại vinh quang cho Guild!' });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'create') {
            if (player.guild_id) return interaction.reply({ content: '❌ Bạn đã ở trong một bang hội! Hãy rời đi trước.', flags: require('discord.js').MessageFlags.Ephemeral });
            
            const cost = 1000;
            if (player.gold < cost) return interaction.reply({ content: `❌ Cần 🪙 ${cost} Vàng để lập bang! Bạn chỉ có ${player.gold}.`, flags: require('discord.js').MessageFlags.Ephemeral });

            const name = interaction.options.getString('name');
            // Check name taken
            const check = await db.queryOne('SELECT * FROM guilds WHERE name = $1', [name]);
            if (check) return interaction.reply({ content: '❌ Tên bang hội này đã tồn tại!', flags: require('discord.js').MessageFlags.Ephemeral });

            // Generate UUID
            const crypto = require('crypto');
            const gId = crypto.randomBytes(4).toString('hex');

            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [cost, userId]);
            await db.execute(
                'INSERT INTO guilds (guild_id, name, owner_id) VALUES ($1, $2, $3)',
                [gId, name, userId]
            );
            await db.execute('UPDATE players SET guild_id = $1 WHERE user_id = $2', [gId, userId]);

            return interaction.reply(`🏰 **${interaction.user.username}** đã quy tụ các Echo và thành lập bang hội **${name}**! (ID: \`${gId}\`)`);
        }

        if (sub === 'join') {
            if (player.guild_id) return interaction.reply({ content: '❌ Bạn đã ở trong một bang hội! Hãy rời đi trước.', flags: require('discord.js').MessageFlags.Ephemeral });
            
            const gId = interaction.options.getString('guild_id');
            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [gId]);
            
            if (!guild) return interaction.reply({ content: '❌ ID Bang hội không hợp lệ!', flags: require('discord.js').MessageFlags.Ephemeral });

            await db.execute('UPDATE players SET guild_id = $1 WHERE user_id = $2', [gId, userId]);
            return interaction.reply(`🏰 Bạn đã gia nhập bang hội **${guild.name}** thành công!`);
        }

        if (sub === 'leave') {
            if (!player.guild_id) return interaction.reply({ content: '❌ Bạn không ở trong bang nào.', flags: require('discord.js').MessageFlags.Ephemeral });
            
            const guild = await db.queryOne('SELECT * FROM guilds WHERE guild_id = $1', [player.guild_id]);
            
            if (guild.owner_id === userId) {
                return interaction.reply({ content: '⚠️ Bạn là Bang Chủ! Bạn không thể rời bang. Hãy nhường chức hoặc giải tán bang (Tính năng đang phát triển).', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET guild_id = NULL WHERE user_id = $1', [userId]);
            return interaction.reply(`🚶 Bạn đã rời khỏi bang hội **${guild.name}** và trở thành lữ khách tự do.`);
        }
    }
};

