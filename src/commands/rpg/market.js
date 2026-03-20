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
            sub.setName('list')
               .setDescription('Xem các vật phẩm đang được rao bán')
        )
        .addSubcommand(sub => 
            sub.setName('sell')
               .setDescription('Đăng bán 1 vật phẩm')
               .addStringOption(opt => opt.setName('item_id').setDescription('Mã vật phẩm').setRequired(true))
               .addStringOption(opt => opt.setName('price').setDescription('Giá bán (Vàng, hỗ trợ k/m/b)').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('buy')
               .setDescription('Mua một vật phẩm trên chợ')
               .addIntegerOption(opt => opt.setName('listing_id').setDescription('ID của kiện hàng (Xem trong list)').setRequired(true))
        ),
    help: {
        usage: '/market <list|sell|buy>',
        examples: ['/market list', '/market sell item_id:16 price:5000', '/market buy listing_id:1'],
        description: 'Hệ thống giao dịch giữa những người chơi. Bạn có thể rao bán đồ dư thừa hoặc mua những món đồ cực phẩm từ người khác bằng Vàng.'
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa tham gia thế giới này!', flags: require('discord.js').MessageFlags.Ephemeral });

        if (sub === 'list') {
            const listings = await db.queryAll('SELECT * FROM market ORDER BY created_at DESC LIMIT 10');
            
            if (listings.length === 0) {
                return interaction.reply({ content: '🛒 Chợ Giao Dịch hiện đang vắng bóng người bán.', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle('⚖️ Chợ Giao Dịch EchoWorld')
                .setColor('#f39c12')
                .setDescription('Danh sách 10 vật phẩm mới nhất được niêm yết:');

            listings.forEach(l => {
                const item = itemsData.getItem(l.item_id);
                const itemName = item ? `**${item.name}** [${item.rarity}]` : l.item_id;
                embed.addFields({
                    name: `Mã đơn: #${l.listing_id} | Người bán: <@${l.seller_id}>`,
                    value: `Vật phẩm: ${itemName}\nGiá: 🪙 **${l.price} Vàng**`,
                    inline: false
                });
            });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'sell') {
            const itemId = interaction.options.getString('item_id');
            const priceStr = interaction.options.getString('price');
            const price = parseAmount(priceStr);

            if (isNaN(price) || price <= 0) {
                return interaction.reply({ content: '❌ Giá bán không hợp lệ!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Verify ownership
            const inventoryRow = await db.queryOne('SELECT * FROM inventory WHERE user_id = $1 AND item_id = $2 AND amount > 0', [userId, itemId]);
            if (!inventoryRow) {
                return interaction.reply({ content: `❌ Bạn không có \`${itemId}\` trong túi đồ.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Verify not equipped
            const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
            if (equip && (equip.weapon_id === itemId || equip.armor_id === itemId || equip.accessory_id === itemId)) {
                return interaction.reply({ content: `❌ Vật phẩm đang được mặc! Dùng \`/equip\` để tháo ra trước.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Take item from inventory
            if (inventoryRow.amount <= 1) {
                await db.execute('DELETE FROM inventory WHERE id = $1', [inventoryRow.id]);
            } else {
                await db.execute('UPDATE inventory SET amount = amount - 1 WHERE id = $1', [inventoryRow.id]);
            }

            // Create listing
            await db.execute(
                'INSERT INTO market (seller_id, item_id, price) VALUES ($1, $2, $3)',
                [userId, itemId, price]
            );

            const itemInfo = itemsData.getItem(itemId);
            return interaction.reply(`🛒 Bạn đã đăng bán thành công **${itemInfo ? itemInfo.name : itemId}** với giá 🪙 **${price} Vàng**! (Lưu ý: Mức thuế Giao dịch của Lãnh chúa là 10% khi chốt đơn).`);
        }

        if (sub === 'buy') {
            const listingId = interaction.options.getInteger('listing_id');

            const listing = await db.queryOne('SELECT * FROM market WHERE listing_id = $1', [listingId]);
            if (!listing) return interaction.reply({ content: `❌ Kiện hàng #${listingId} không tồn tại hoặc đã bị mua.`, flags: require('discord.js').MessageFlags.Ephemeral });

            if (listing.seller_id === userId) return interaction.reply({ content: `❌ Bạn không thể tự mua đồ của mình!`, flags: require('discord.js').MessageFlags.Ephemeral });

            if (player.gold < listing.price) {
                return interaction.reply({ content: `❌ Bạn không đủ vàng! (Cần ${listing.price}, bạn có ${player.gold})`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Execute transaction
            const tax = Math.floor(listing.price * 0.10);
            const sellerRevenue = Math.max(1, listing.price - tax); // Tránh âm tiền

            // 1. Deduct gold from buyer
            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [listing.price, userId]);
            // 2. Add gold to seller
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [sellerRevenue, listing.seller_id]);
            // 3. Give item to buyer
            await db.execute(
                'INSERT INTO inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', 
                [userId, listing.item_id]
            );
            // 4. Delete listing
            await db.execute('DELETE FROM market WHERE listing_id = $1', [listingId]);

            const itemInfo = itemsData.getItem(listing.item_id);
            return interaction.reply(`🛍️ Tuyệt vời! Bạn đã mua thành công **${itemInfo ? itemInfo.name : listing.item_id}** với giá 🪙 **${listing.price} Vàng**.`);
        }
    }
};

