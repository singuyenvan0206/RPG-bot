const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const shopData = require('../../utils/shopData');
const itemsData = require('../../utils/itemsData');
const materialsData = require('../../utils/materialsData');

module.exports = {
    category: 'Economy',
    aliases: ['s', 'store', 'buy'],
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Cửa hàng vật phẩm EchoWorld — Gõ /shop để xem hàng, /shop buy để mua')
        .addSubcommand(sub =>
            sub.setName('buy')
                .setDescription('Mua vật phẩm bằng vàng')
                .addStringOption(option =>
                    option.setName('item_id')
                        .setDescription('Mã hoặc ID vật phẩm muốn mua')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Số lượng muốn mua (mặc định: 1)')
                        .setMinValue(1)
                )
        ),
    help: {
        usage: '/shop | /shop buy <item_id> [amount]',
        examples: ['/shop', '/shop buy iron_ore 10', '$buy iron_ore'],
        description: 'Gõ /shop để xem cửa hàng. Dùng /shop buy <ID> [số lượng] để mua.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const subcommand = interaction.options.getSubcommand(false);
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);

        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        // Default to showing shop list when no subcommand
        if (!subcommand || subcommand !== 'buy') {
            const embed = new EmbedBuilder()
                .setTitle('🏪 Cửa Hàng EchoWorld')
                .setDescription(`Chào **${player.class}** ${interaction.user.username}! Bạn có 🪙 **${player.gold.toLocaleString()} Vàng**.\n\nDùng \`/shop buy <ID>\` để mua đồ.`)
                .setColor('#f1c40f')
                .setFooter({ text: 'Dùng /shop buy <ID> để mua | Số ID nằm trong dấu [...]' });

            // General Store
            let generalList = '';
            shopData.general_store.forEach(item => {
                let name = item.name;
                const shopCode = item.code || item.id;
                if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
                    const info = itemsData.getItem(item.id);
                    name = info ? info.name : item.id;
                } else if (item.type === 'material') {
                    const info = materialsData.getMaterial(item.id);
                    name = info ? info.name : item.id;
                } else {
                    name = item.name || item.id;
                }
                generalList += `\`[${shopCode}]\` **${name}**: 🪙 **${item.price}**\n`;
            });
            embed.addFields({ name: '🛒 Cửa Hàng Phổ Thông', value: generalList || 'Trống' });

            // Skill Shop (Class Specific)
            const classSkills = shopData.skill_shops[player.class];
            if (classSkills) {
                let skillList = '';
                classSkills.forEach(book => {
                    skillList += `\`[${book.code}]\` **${book.name}**: 🪙 **${book.price}**\n*${book.desc}*\n`;
                });
                embed.addFields({ name: `📕 Tiệm Sách Kĩ Năng (${player.class})`, value: skillList });
            }

            // Black Market
            let blackList = '';
            shopData.black_market.forEach(item => {
                const info = materialsData.getMaterial(item.id);
                if (info) {
                    blackList += `\`[${item.code}]\` **${info.name}**: 🪙 **${item.price}**\n`;
                }
            });
            if (blackList) embed.addFields({ name: '🌑 Chợ Đen (Vật Liệu Hiếm)', value: blackList });

            return interaction.reply({ embeds: [embed] });
        }

        // /shop buy
        if (subcommand === 'buy') {
            const itemIdInput = interaction.options.getString('item_id');
            const amount = interaction.options.getInteger('amount') || 1;

            const classSkills = shopData.skill_shops[player.class] || [];
            const allShopItems = [...shopData.general_store, ...shopData.black_market, ...classSkills];

            // Search by id, code, or item code from itemsData/materialsData
            let targetShopItem = allShopItems.find(i =>
                i.id === itemIdInput ||
                (i.code && String(i.code) === String(itemIdInput))
            );

            let itemInfo = null;
            if (!targetShopItem) {
                itemInfo = itemsData.getItem(itemIdInput) || materialsData.getMaterial(itemIdInput);
                if (itemInfo) {
                    targetShopItem = allShopItems.find(i => i.id === itemInfo.id);
                }
            } else {
                if (targetShopItem.skill_id) {
                    itemInfo = { id: targetShopItem.id, name: targetShopItem.name, type: 'skill_book', skill_id: targetShopItem.skill_id };
                } else {
                    itemInfo = itemsData.getItem(targetShopItem.id) || materialsData.getMaterial(targetShopItem.id) || targetShopItem;
                }
            }

            if (!targetShopItem || !itemInfo) return interaction.reply({ content: '❌ Vật phẩm không có bán trong shop hoặc ID sai.', flags: MessageFlags.Ephemeral });

            if (itemInfo.type === 'skill_book' && amount > 1) {
                return interaction.reply({ content: '❌ Bạn chỉ có thể học mỗi kĩ năng 1 lần.', flags: MessageFlags.Ephemeral });
            }

            const totalPrice = targetShopItem.price * amount;

            if (player.gold < totalPrice) {
                return interaction.reply({ content: `❌ Không đủ vàng! Cần 🪙 **${totalPrice.toLocaleString()}** — còn thiếu **${(totalPrice - player.gold).toLocaleString()}**.`, flags: MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [totalPrice, userId]);

            if (itemInfo.type === 'skill_book') {
                await db.execute(
                    'INSERT INTO player_skills (user_id, skill_id, level) VALUES ($1, $2, 1) ON CONFLICT (user_id, skill_id) DO UPDATE SET level = player_skills.level + 1',
                    [userId, itemInfo.skill_id]
                );
            } else {
                await db.execute(
                    'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + EXCLUDED.amount',
                    [userId, itemInfo.id, amount]
                );
            }

            const buyEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Mua Hàng Thành Công')
                .setDescription(`Bạn đã mua **${amount}x ${itemInfo.name}** với giá 🪙 **${totalPrice.toLocaleString()} Vàng**.\n${itemInfo.type === 'skill_book' ? '✨ Kĩ năng đã được học/nâng cấp!' : ''}\n\nSố dư còn lại: 🪙 **${(player.gold - totalPrice).toLocaleString()} Vàng**.`);

            return interaction.reply({ embeds: [buyEmbed] });
        }
    }
};
