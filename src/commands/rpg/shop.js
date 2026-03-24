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
        const { MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
        const subcommand = interaction.options.getSubcommand(false);
        const userId = interaction.user.id;
        const player = await db.getPlayer(userId);

        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        // Default categories configuration
        const categories = {
            'weapons': { emoji: '⚔️', label: 'Vũ Khí', data: shopData.weapons },
            'armors': { emoji: '🛡️', label: 'Giáp Trụ', data: shopData.armors },
            'accessories': { emoji: '💍', label: 'Trang Sức', data: shopData.accessories },
            'consumables': { emoji: '🧪', label: 'Tiêu Hao', data: shopData.consumables },
            'materials': { emoji: '🛠️', label: 'Nguyên Liệu', data: shopData.materials },
            'black_market': { emoji: '🌑', label: 'Chợ Đen', data: shopData.black_market },
            'skills': { emoji: '📕', label: 'Kỹ Năng', data: shopData.skill_shops[player.class] || [] }
        };

        const createShopEmbed = (categoryKey = null) => {
            const embed = new EmbedBuilder()
                .setTitle('🏪 Cửa Hàng EchoWorld')
                .setColor('#f1c40f')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setDescription(`Chào **${player.class}** ${interaction.user.username}! Bạn có 🪙 **${player.gold.toLocaleString()} Vàng**.\n\nDùng Menu bên dưới để xem đồ, gõ \`/shop buy <ID>\` để mua nhanh.`)
                .setFooter({ text: 'Dùng menu để chọn Category | /shop buy [mã] để mua' });

            const buildList = (itemsArray) => {
                let list = '';
                itemsArray.forEach(item => {
                    let name = item.name;
                    let info = null;

                    if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
                        info = itemsData.getItem(item.id);
                    } else if (item.type === 'material') {
                        info = materialsData.getMaterial(item.id);
                    }

                    if (info) name = info.name;
                    else if (!name) name = item.id;

                    const shopCode = (info && info.code) ? info.code : (item.code || item.id);
                    list += `\`[${shopCode}]\` **${name}**: 🪙 **${item.price.toLocaleString()}**\n`;
                });
                return list || '*Trống*';
            };

            if (!categoryKey) {
                // Home view: Summary
                for (const [key, cat] of Object.entries(categories)) {
                    if (key === 'weapons') {
                        const filtered = cat.data.filter(i => {
                            const info = itemsData.getItem(i.id);
                            return !info || !info.requiredClass || info.requiredClass.includes(player.class);
                        });
                        embed.addFields({ name: `${cat.emoji} ${cat.label}`, value: `> Có **${filtered.length}** món phù hợp.`, inline: true });
                    } else {
                        embed.addFields({ name: `${cat.emoji} ${cat.label}`, value: `> Có **${cat.data.length}** vật phẩm.`, inline: true });
                    }
                }
            } else {
                const cat = categories[categoryKey];
                embed.setTitle(`${cat.emoji} Danh mục: ${cat.label}`);
                let items = cat.data;

                if (categoryKey === 'weapons') {
                    items = items.filter(i => {
                        const info = itemsData.getItem(i.id);
                        return !info || !info.requiredClass || info.requiredClass.includes(player.class);
                    });
                }

                // Split into fields if long
                if (items.length > 15) {
                    for (let i = 0; i < items.length; i += 15) {
                        const chunk = items.slice(i, i + 15);
                        embed.addFields({ 
                            name: i === 0 ? `${cat.label} hiện có` : `${cat.label} (Tiếp)`, 
                            value: buildList(chunk), 
                            inline: true 
                        });
                    }
                } else {
                    embed.setDescription(`Các vật phẩm thuộc danh mục **${cat.label}**:\n\n${buildList(items)}`);
                }
            }
            return embed;
        };

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_category')
            .setPlaceholder('Chọn quầy hàng để xem...')
            .addOptions([
                { label: 'Trang Chủ', value: 'home', emoji: '🏠', description: 'Xem tổng quan cửa hàng' },
                ...Object.entries(categories).map(([key, cat]) => ({
                    label: cat.label,
                    value: key,
                    emoji: cat.emoji,
                    description: `Xem các mặt hàng ${cat.label}`
                }))
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // --- SUBCOMMAND: BUY ---
        if (subcommand === 'buy') {
            const itemIdInput = interaction.options.getString('item_id');
            const amount = interaction.options.getInteger('amount') || 1;

            const allShopItems = Object.values(categories).flatMap(cat => cat.data);

            let targetShopItem = allShopItems.find(i =>
                i.id === itemIdInput || (i.code && String(i.code) === String(itemIdInput))
            );

            let itemInfo = null;
            if (!targetShopItem) {
                itemInfo = itemsData.getItem(itemIdInput) || materialsData.getMaterial(itemIdInput);
                if (itemInfo) targetShopItem = allShopItems.find(i => i.id === itemInfo.id);
            } else {
                if (targetShopItem.skill_id) {
                    itemInfo = { id: targetShopItem.id, name: targetShopItem.name, type: 'skill_book', skill_id: targetShopItem.skill_id };
                } else {
                    itemInfo = itemsData.getItem(targetShopItem.id) || materialsData.getMaterial(targetShopItem.id) || targetShopItem;
                }
            }

            if (!targetShopItem || !itemInfo) return interaction.reply({ content: '❌ Vật phẩm không có bán hoặc ID sai.', flags: MessageFlags.Ephemeral });

            if (itemInfo.type === 'skill_book' && amount > 1) {
                return interaction.reply({ content: '❌ Bạn chỉ có thể học mỗi kĩ năng 1 lần.', flags: MessageFlags.Ephemeral });
            }

            const totalPrice = targetShopItem.price * amount;
            if (player.gold < totalPrice) return interaction.reply({ content: `❌ Thiếu 🪙 **${(totalPrice - player.gold).toLocaleString()}** vàng!`, flags: MessageFlags.Ephemeral });

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
                .setDescription(`Bạn đã mua **${amount}x ${itemInfo.name}** với giá 🪙 **${totalPrice.toLocaleString()} Vàng**.\n\nSố dư còn lại: 🪙 **${(player.gold - totalPrice).toLocaleString()} Vàng**.`);

            return interaction.reply({ embeds: [buyEmbed] });
        }

        // --- SHOW SHOP WITH MENU ---
        const response = await interaction.reply({ embeds: [createShopEmbed()], components: [row] });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Lệnh này không dành cho bạn!', flags: MessageFlags.Ephemeral });
            const selected = i.values[0];
            await i.update({ embeds: [createShopEmbed(selected === 'home' ? null : selected)] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};
