const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const { parseAmount } = require('../../utils/numberHelper');
const itemsData = require('../../utils/itemsData');

module.exports = {
    category: 'Economy',
    aliases: ['ma', 'shop'],
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Chợ Giao Dịch Thế Giới')
        .addSubcommand(sub => 
            sub.setName('sell')
               .setDescription('Đăng bán/đấu giá 1 vật phẩm')
               .addStringOption(opt => opt.setName('item_id').setDescription('Mã vật phẩm').setRequired(true))
               .addStringOption(opt => opt.setName('price').setDescription('Giá bán hoặc Giá khởi điểm (Vàng)').setRequired(true))
               .addBooleanOption(opt => opt.setName('auction').setDescription('Đặt là Đấu Giá?'))
               .addIntegerOption(opt => opt.setName('duration').setDescription('Thời gian đấu giá (giờ, mặc định 24)').setMinValue(1).setMaxValue(72))
        )
        .addSubcommand(sub => 
            sub.setName('buy')
               .setDescription('Mua đứt một vật phẩm (không áp dụng cho đấu giá)')
               .addIntegerOption(opt => opt.setName('listing_id').setDescription('ID của kiện hàng').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('bid')
               .setDescription('Đặt giá thầu cho một vật phẩm đấu giá')
               .addIntegerOption(opt => opt.setName('listing_id').setDescription('ID của kiện hàng').setRequired(true))
               .addStringOption(opt => opt.setName('amount').setDescription('Số vàng muốn thầu').setRequired(true))
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: 64 });

        if (sub === 'list') {
            const listings = await db.queryAll('SELECT * FROM market ORDER BY created_at DESC LIMIT 15');
            if (listings.length === 0) return interaction.reply({ content: '🛒 Chợ Giao Dịch hiện đang vắng bóng người bán.', flags: 64 });

            const embed = new EmbedBuilder()
                .setTitle('⚖️ Chợ Giao Dịch EchoWorld')
                .setColor('#f39c12')
                .setDescription('Danh sách các vật phẩm đang niêm yết:');

            listings.forEach(l => {
                const item = itemsData.getItem(l.item_id);
                const itemName = item ? `**${item.name}** [${item.rarity}]` : l.item_id;
                let info = `Giá: 🪙 **${l.price.toLocaleString()}**`;
                if (l.is_auction) {
                    const timeLeft = Math.max(0, Math.floor((Number(l.expire_at) - (Date.now() / 1000)) / 60));
                    info = `🔨 **Đấu Giá** | Thầu cao nhất: 🪙 **${l.current_bid.toLocaleString()}**\nKết thúc trong: ${timeLeft} phút`;
                }
                embed.addFields({ name: `[#${l.listing_id}] ${itemName}`, value: info, inline: true });
            });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'sell') {
            const itemId = interaction.options.getString('item_id');
            const price = parseAmount(interaction.options.getString('price'));
            const isAuction = interaction.options.getBoolean('auction') || false;
            const duration = interaction.options.getInteger('duration') || 24;

            if (isNaN(price) || price <= 0) return interaction.reply({ content: '❌ Giá không lệ!', flags: 64 });

            const inv = await db.queryOne('SELECT * FROM inventory WHERE user_id = $1 AND item_id = $2 AND amount > 0', [userId, itemId]);
            if (!inv) return interaction.reply({ content: `❌ Bạn không có vật phẩm này!`, flags: 64 });

            const expireAt = Math.floor(Date.now() / 1000) + (duration * 3600);
            
            await db.execute('UPDATE inventory SET amount = amount - 1 WHERE id = $1', [inv.id]);
            if (inv.amount <= 1) await db.execute('DELETE FROM inventory WHERE id = $1', [inv.id]);

            await db.execute(
                'INSERT INTO market (seller_id, item_id, price, is_auction, expire_at, current_bid) VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, itemId, price, isAuction, expireAt, isAuction ? price : 0]
            );

            return interaction.reply(`${isAuction ? '🔨 Bạn đã mở cuộc đấu giá' : '🛒 Bạn đã đăng bán'} **${itemsData.getItem(itemId)?.name || itemId}** thành công!`);
        }

        if (sub === 'buy') {
            const lid = interaction.options.getInteger('listing_id');
            const l = await db.queryOne('SELECT * FROM market WHERE listing_id = $1', [lid]);
            if (!l || l.is_auction) return interaction.reply({ content: '❌ Kiện hàng không tồn tại hoặc là đấu giá!', flags: 64 });
            if (player.gold < l.price) return interaction.reply({ content: '❌ Không đủ vàng!', flags: 64 });

            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [l.price, userId]);
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [Math.floor(l.price * 0.9), l.seller_id]);
            await db.execute('INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [userId, l.item_id]);
            await db.execute('DELETE FROM market WHERE listing_id = $1', [lid]);
            return interaction.reply(`🛍️ Bạn đã mua thành công **${itemsData.getItem(l.item_id)?.name || l.item_id}**!`);
        }

        if (sub === 'bid') {
            const lid = interaction.options.getInteger('listing_id');
            const bidAmt = parseAmount(interaction.options.getString('amount'));
            const l = await db.queryOne('SELECT * FROM market WHERE listing_id = $1', [lid]);

            if (!l || !l.is_auction) return interaction.reply({ content: '❌ Kiện hàng không đấu giá!', flags: 64 });
            if (bidAmt <= l.current_bid) return interaction.reply({ content: `❌ Giá thầu phải cao hơn **${l.current_bid}**!`, flags: 64 });
            if (player.gold < bidAmt) return interaction.reply({ content: '❌ Không đủ vàng!', flags: 64 });

            // Refund previous bidder
            if (l.highest_bidder_id) {
                await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [l.current_bid, l.highest_bidder_id]);
            }

            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [bidAmt, userId]);
            await db.execute('UPDATE market SET current_bid = $1, highest_bidder_id = $2 WHERE listing_id = $3', [bidAmt, userId, lid]);
            
            return interaction.reply(`🔨 Bạn đã đặt giá thầu **${bidAmt.toLocaleString()} Vàng** cho Đơn hàng #${lid}!`);
        }
    }
};

