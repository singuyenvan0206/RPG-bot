const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../database');
const materialsData = require('../../utils/materialsData');

const RECIPES = {
    revive_potion: {
        id: 'revive_potion',
        name: '🕊️ Nước Hồi Sinh',
        gold: 1000,
        materials: { 'life_root': 1, 'magic_core': 2, 'mana_blossom': 5 },
        desc: 'Hồi phục sinh mệnh, xóa bỏ thời gian chờ chết.'
    },
    major_healing_potion: {
        id: 'major_healing_potion',
        name: '🧪 Thuốc Hồi Máu Lớn',
        gold: 100,
        materials: { 'medicinal_herb': 5, 'mana_blossom': 2 },
        desc: 'Thuốc thượng hạng phục hồi 300 HP.'
    },
    healing_potion: {
        id: 'healing_potion',
        name: '🧪 Thuốc Hồi Máu',
        gold: 50,
        materials: { 'medicinal_herb': 3 },
        desc: 'Thuốc tiêu chuẩn phục hồi 150 HP.'
    },
    minor_healing_potion: {
        id: 'minor_healing_potion',
        name: '🧪 Thuốc Hồi Máu Nhỏ',
        gold: 10,
        materials: { 'medicinal_herb': 1 },
        desc: 'Thuốc cơ bản phục hồi 50 HP.'
    },
    // --- MID-TIER MATERIALS ---
    steel_ingot: {
        id: 'steel_ingot',
        name: '🌑 Thỏi Thép',
        gold: 200,
        materials: { 'iron_ore': 5 },
        desc: 'Ghép từ 5 Quặng Sắt.'
    },
    elven_wood: {
        id: 'elven_wood',
        name: '🍃 Gỗ Tinh Linh',
        gold: 200,
        materials: { 'oak_wood': 5 },
        desc: 'Ghép từ 5 Gỗ Sồi.'
    },
    mana_blossom: {
        id: 'mana_blossom',
        name: '🌸 Hoa Ma Thuật',
        gold: 200,
        materials: { 'magic_core': 5 },
        desc: 'Ghép từ 5 Lõi Phép Thuật.'
    },
    emerald: {
        id: 'emerald',
        name: '💚 Lục Bảo',
        gold: 200,
        materials: { 'bronze_scrap': 5 },
        desc: 'Ghép từ 5 Mảnh Đồng Vụn.'
    },
    // --- HIGH-TIER MATERIALS ---
    demon_horn: {
        id: 'demon_horn',
        name: '😈 Sừng Quỷ',
        gold: 1000,
        materials: { 'steel_ingot': 5 },
        desc: 'Ghép từ 5 Thỏi Thép.'
    },
    spirit_bark: {
        id: 'spirit_bark',
        name: '🍂 Vỏ Cây Linh Hồn',
        gold: 1000,
        materials: { 'elven_wood': 5 },
        desc: 'Ghép từ 5 Gỗ Tinh Linh.'
    },
    light_essence: {
        id: 'light_essence',
        name: '✨ Tinh Hoa Ánh Sáng',
        gold: 1000,
        materials: { 'mana_blossom': 5 },
        desc: 'Ghép từ 5 Hoa Ma Thuật.'
    },
    void_shard: {
        id: 'void_shard',
        name: '☄️ Mảnh Vỡ Hư Không',
        gold: 1000,
        materials: { 'emerald': 5 },
        desc: 'Ghép từ 5 Lục Bảo.'
    }
};

module.exports = {
    category: 'Crafting',
    aliases: ['cr', 'chetao'],
    data: new SlashCommandBuilder()
        .setName('craft')
        .setDescription('Chế tạo Nước Hồi Sinh và Thuốc Hồi Máu từ nguyên liệu.')
        .addStringOption(option =>
            option.setName('recipe_id')
                .setDescription('Mã ID của công thức muốn chế tạo')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số lượng muốn chế (mặc định: 1)')
                .setRequired(false)
                .setMinValue(1)
        ),
    help: {
        usage: '/craft [recipe_id] [amount]',
        examples: ['/craft', '/craft revive_potion 1', '$cr healing_potion 5'],
        description: 'Xem danh sách công thức hoặc chế tạo các loại thuốc nước.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const recipeId = interaction.options.getString('recipe_id');
        const amount = interaction.options.getInteger('amount') || 1;

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        // SHOW RECIPES LIST
        if (!recipeId || !RECIPES[recipeId]) {
            const embed = new EmbedBuilder()
                .setTitle('🔮 Xưởng Chế Tạo Thực Vật')
                .setDescription('Sử dụng nguyên liệu kiếm được từ Thám hiểm hoặc Khai thác (/mine) để chế thuốc.\nGõ `/craft <mã_công_thức> [số_lượng]` để chế tạo.')
                .setColor('#2ecc71');
            
            for (const [key, rc] of Object.entries(RECIPES)) {
                let reqString = `🪙 **${rc.gold} Vàng**\n`;
                for (const [matId, qty] of Object.entries(rc.materials)) {
                    const info = materialsData.getMaterial(matId);
                    reqString += `- ${qty}x ${info ? info.name : matId}\n`;
                }
                embed.addFields({ name: `[${key}] ${rc.name}`, value: `*${rc.desc}*\n👉 Yêu cầu:\n${reqString}`, inline: true });
            }

            if (recipeId) {
                return interaction.reply({ content: `❌ Không tìm thấy công thức: \`${recipeId}\`.\nDưới đây là danh sách các công thức hiện có:`, embeds: [embed], flags: MessageFlags.Ephemeral });
            }
            return interaction.reply({ embeds: [embed] });
        }

        // CRAFTING LOGIC
        const recipe = RECIPES[recipeId];
        const totalGold = recipe.gold * amount;

        if (player.gold < totalGold) {
            return interaction.reply({ content: `❌ Bạn thiếu 🪙 **${(totalGold - player.gold).toLocaleString()}** vàng để chế tạo ${amount}x ${recipe.name}!`, flags: MessageFlags.Ephemeral });
        }

        // Check Inventory
        const inventoryRows = await db.queryAll('SELECT item_id, amount FROM inventory WHERE user_id = $1', [userId]);
        const invMap = {};
        for (const row of inventoryRows) invMap[row.item_id] = row.amount;

        for (const [matId, qty] of Object.entries(recipe.materials)) {
            const need = qty * amount;
            const have = invMap[matId] || 0;
            if (have < need) {
                const info = materialsData.getMaterial(matId);
                return interaction.reply({ content: `❌ Bạn thiếu **${need - have}x ${info ? info.name : matId}** để chế tạo ${amount}x ${recipe.name}!`, flags: MessageFlags.Ephemeral });
            }
        }

        // Deduct materials & gold
        await db.withTransaction(async (client) => {
            await client.query('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [totalGold, userId]);
            for (const [matId, qty] of Object.entries(recipe.materials)) {
                const need = qty * amount;
                await client.query('UPDATE inventory SET amount = amount - $1 WHERE user_id = $2 AND item_id = $3', [need, userId, matId]);
            }
            // Add result
            await client.query('INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + $3', [userId, recipe.id, amount]);
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✨ Chế Tạo Thành Công!')
            .setColor('#2ecc71')
            .setDescription(`Nhà giả kim vung gậy, nguyên liệu trong vạc hòa quyện làm một...\n\n🎉 Bạn xách về **${amount}x ${recipe.name}**!\n- Bị trừ: 🪙 **${totalGold.toLocaleString()} Vàng** và nguyên liệu tương ứng.`);
        
        return interaction.reply({ embeds: [successEmbed] });
    }
};
