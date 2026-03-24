const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const itemsData = require('../../utils/itemsData');
const materialsData = require('../../utils/materialsData');

module.exports = {
    category: 'System',
    aliases: ['iteminfo', 'ii', 'info'],
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Xem thông tin chi tiết của một vật phẩm hoặc nguyên liệu')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Tên, mã số (code) hoặc ID của vật phẩm')
                .setRequired(true)
        ),
    help: {
        usage: '/item <query>',
        examples: ['/item rusted_sword', '/item 101', '/item Kiếm Rỉ Sét'],
        description: 'Tra cứu thông tin chi tiết về chỉ số, hệ nguyên tố, đặc tính và mô tả của bất kì trang bị hay nguyên liệu nào trong game.'
    },
    async execute(interaction) {
        const queryStr = interaction.options.getString('query') || '';
        if (!queryStr) {
            return interaction.reply({ content: '❌ Vui lòng nhập tên, mã (code) hoặc ID vật phẩm!', flags: MessageFlags.Ephemeral });
        }
        let query = queryStr.toLowerCase().trim();
        
        let foundItem = null;
        let isMaterial = false;

        // 1. Search in Equipment (itemsData)
        const allEquips = itemsData.getAllItems();
        // Exact ID match
        if (allEquips[query]) {
            foundItem = allEquips[query];
        } else {
            // Code or Name match
            for (const key in allEquips) {
                const eq = allEquips[key];
                if (eq.code == query || eq.name.toLowerCase().includes(query)) {
                    foundItem = eq;
                    break;
                }
            }
        }

        // 2. Search in Materials (materialsData) if not found
        if (!foundItem) {
            const allMats = materialsData.getAllMaterials();
            if (allMats[query]) {
                foundItem = allMats[query];
                isMaterial = true;
            } else {
                for (const key in allMats) {
                    const mat = allMats[key];
                    if (mat.code == query || mat.name.toLowerCase().includes(query)) {
                        foundItem = mat;
                        isMaterial = true;
                        break;
                    }
                }
            }
        }

        if (!foundItem) {
            return interaction.reply({ 
                content: `❌ Không tìm thấy vật phẩm nào có chứa từ khóa \`${queryStr}\`. Mẹo: Bạn có thể nhập mã số trong ngoặc vuông (VD: 101, 3001) lấy từ /inventory.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Color mapping based on Rarity
        const rarityColors = {
            'Common': '#95a5a6',     // Gray
            'Rare': '#3498db',       // Blue
            'Epic': '#9b59b6',       // Purple
            'Legendary': '#f1c40f',  // Gold
            'Mythic': '#e74c3c'      // Red
        };
        const embedColor = rarityColors[foundItem.rarity] || '#ffffff';

        // Base Title
        const embed = new EmbedBuilder()
            .setTitle(`${foundItem.name}`)
            .setColor(embedColor)
            .setDescription(`*${foundItem.desc || 'Không có mô tả chi tiết.'}*`);

        // General Info
        embed.addFields(
            { name: 'Phân Loại', value: isMaterial ? '🛠️ Nguyên liệu' : (foundItem.type === 'weapon' ? '⚔️ Vũ khí' : (foundItem.type === 'armor' ? '🛡️ Giáp trụ' : '💍 Trang sức')), inline: true },
            { name: 'Độ Hiếm (Rarity)', value: `**${foundItem.rarity || 'Common'}**`, inline: true },
            { name: 'Mã (Code) / ID', value: `\`${foundItem.code || 'N/A'}\` / \`${foundItem.id}\``, inline: true }
        );

        // Stats (If Equipment)
        if (!isMaterial) {
            let statsString = '';
            if (foundItem.atk) statsString += `🗡️ **ATK:** +${foundItem.atk}\n`;
            if (foundItem.def) statsString += `🛡️ **DEF:** +${foundItem.def}\n`;
            if (foundItem.hp) statsString += `❤️ **HP:** +${foundItem.hp}\n`;
            if (foundItem.mana) statsString += `🔮 **Mana:** +${foundItem.mana}\n`;
            if (foundItem.agi) statsString += `⚡ **AGI:** +${foundItem.agi}\n`;
            if (foundItem.crit) statsString += `🎯 **CRIT:** +${Math.round(foundItem.crit * 100)}%\n`;
            
            if (statsString.length > 0) {
                embed.addFields({ name: '📊 Chỉ số Thô', value: statsString, inline: false });
            }

            // Special Properties
            let specialStr = '';
            if (foundItem.element) specialStr += `**Nguyên tố:** ${foundItem.element}\n`;
            if (foundItem.requiredClass && foundItem.requiredClass.length > 0) {
                specialStr += `**Class yêu cầu:** ${foundItem.requiredClass.join(', ')}\n`;
            } else {
                specialStr += `**Class yêu cầu:** Mọi Class\n`;
            }
            if (foundItem.passives && foundItem.passives.length > 0) {
                specialStr += `**Kỹ năng Nội tại:** ${foundItem.passives.join(', ')}\n`;
            }

            if (specialStr.length > 0) {
                embed.addFields({ name: '✨ Thuộc tính đặc biệt', value: specialStr, inline: false });
            }
        }
        
        return interaction.reply({ embeds: [embed] });
    }
};
