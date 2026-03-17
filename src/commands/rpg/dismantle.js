const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const gifData = require('../../utils/gifData');
const itemsData = require('../../utils/itemsData');
const materialsData = require('../../utils/materialsData');

module.exports = {
    category: 'Crafting',
    aliases: ['dis', 'split'],
    data: new SlashCommandBuilder()
        .setName('dismantle')
        .setDescription('Phân rã trang bị ra thành Nguyên Liệu Rèn')
        .addStringOption(option =>
            option.setName('item_ids')
                .setDescription('ID trang bị (dùng "all" cho tất cả, hoặc nhiều ID cách nhau bằng dấu phẩy)')
                .setRequired(true)
        ),
    help: {
        usage: '/dismantle <item_id|all|id1,id2,...>',
        examples: ['/dismantle sword', '/dismantle all', '/dismantle iron_sword,bronze_armor'],
        description: 'Phá hủy trang bị để thu hồi nguyên liệu. Dùng "all" để phân rã toàn bộ trang bị trong túi đồ (trừ đồ đang mặc).'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const { MessageFlags } = require('discord.js');
        const rawInput = interaction.options.getString('item_ids').trim();

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        // Get equipped items to protect them
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const equippedIds = new Set([
            equip?.weapon_id,
            equip?.armor_id,
            equip?.accessory_id
        ].filter(Boolean));

        let targetItemIds = [];

        if (rawInput.toLowerCase() === 'all') {
            // Get ALL weapon/armor/accessory items from inventory, excluding equipped
            const allInventory = await db.queryAll(
                'SELECT * FROM inventory WHERE user_id = $1 AND amount > 0',
                [userId]
            );
            for (const row of allInventory) {
                const info = itemsData.getItem(row.item_id);
                if (info && (info.type === 'weapon' || info.type === 'armor' || info.type === 'accessory')) {
                    if (!equippedIds.has(row.item_id)) {
                        targetItemIds.push(row.item_id);
                    }
                }
            }

            if (targetItemIds.length === 0) {
                return interaction.reply({ content: '❌ Không có trang bị nào có thể phân rã (trừ đồ đang mặc).', flags: MessageFlags.Ephemeral });
            }
        } else {
            // Parse comma-separated list
            targetItemIds = rawInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        // Dismantle Animation
        const dismantleEmbed = new EmbedBuilder()
            .setTitle('⚒️ Đang Phân Rã...')
            .setDescription(`Đang tháo dỡ **${targetItemIds.length}** món trang bị...`)
            .setColor('#e74c3c')
            .setImage(gifData.dismantle);

        const msg = await interaction.reply({ embeds: [dismantleEmbed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(2500);

        // Process each item
        const results = [];
        const errors = [];
        const materialsTotals = {};

        for (const rawId of targetItemIds) {
            const itemInfo = itemsData.getItem(rawId);
            if (!itemInfo) {
                errors.push(`❌ \`${rawId}\` — Không tồn tại.`);
                continue;
            }

            const itemId = itemInfo.id;

            if (equippedIds.has(itemId)) {
                errors.push(`🔒 \`${itemInfo.name}\` — Đang mặc, không thể phân rã.`);
                continue;
            }

            const inventoryRow = await db.queryOne('SELECT * FROM inventory WHERE user_id = $1 AND item_id = $2 AND amount > 0', [userId, itemId]);
            if (!inventoryRow) {
                errors.push(`❌ \`${itemInfo.name}\` — Không có trong túi đồ.`);
                continue;
            }

            // Remove from inventory
            if (inventoryRow.amount <= 1) {
                await db.execute('DELETE FROM inventory WHERE id = $1', [inventoryRow.id]);
            } else {
                await db.execute('UPDATE inventory SET amount = amount - 1 WHERE id = $1', [inventoryRow.id]);
            }

            // Calculate material reward
            let matReward = 'iron_ore';
            let matAmount = 3;

            if (itemInfo.rarity === 'Rare') { matReward = 'magic_core'; matAmount = 1; }
            else if (itemInfo.rarity === 'Epic') { matReward = 'void_shard'; matAmount = 1; }

            materialsTotals[matReward] = (materialsTotals[matReward] || 0) + matAmount;
            results.push(`✅ **${itemInfo.name}** → ${matAmount}x ${materialsData.getMaterial(matReward).name}`);
        }

        // Give all collected materials
        for (const [matId, total] of Object.entries(materialsTotals)) {
            await db.execute(
                'INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + $3',
                [userId, matId, total]
            );
        }

        // Build result embed
        let desc = '';
        if (results.length > 0) {
            desc += `⚒️ **Phân Rã Thành Công (${results.length}/${targetItemIds.length})**\n${results.join('\n')}`;
        }
        if (errors.length > 0) {
            desc += `\n\n${errors.join('\n')}`;
        }

        const matSummary = Object.entries(materialsTotals)
            .map(([id, amt]) => `**${amt}x ${materialsData.getMaterial(id).name}**`)
            .join(', ');

        if (matSummary) {
            desc += `\n\n🎁 **Tổng Nguyên Liệu Nhận Được:** ${matSummary}`;
        }

        const embed = new EmbedBuilder()
            .setColor(results.length > 0 ? '#e74c3c' : '#7f8c8d')
            .setDescription(desc || '❌ Không có trang bị nào được phân rã.');

        return msg.edit({ embeds: [embed] });
    }
};
