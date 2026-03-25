const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');
const materialsData = require('../../utils/materialsData');
const shopData = require('../../utils/shopData');

module.exports = {
    category: 'RPG',
    aliases: ['i', 'inv', 'bag'],
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Xem túi đồ và nguyên liệu đang sở hữu')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Lọc theo loại vật phẩm (mặc định: tất cả)')
                .setRequired(false)
                .addChoices(
                    { name: 'Tất Cả', value: 'all' },
                    { name: 'Vũ khí & Giáp trụ', value: 'equipment' },
                    { name: 'Nguyên liệu', value: 'materials' }
                )
        ),
    help: {
        usage: '/inventory [filter]',
        examples: ['/inventory', '/inventory equipment', '$i', '$inv'],
        description: 'Mở túi đồ để xem trang bị và nguyên liệu. Lọc theo loại để xem nhanh hơn.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const userId = interaction.user.id;
        const filter = interaction.options.getString('filter') || 'all';

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({
                content: '❌ Bạn chưa tham gia thế giới này. Hãy dùng lệnh `/start` trước!',
                flags: MessageFlags.Ephemeral
            });
        }

        const backpackObjects = await db.queryAll('SELECT * FROM inventory WHERE user_id = $1 AND amount > 0', [userId]);

        // Get equipped items to show [E] tag
        const equip = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
        const equippedIds = new Set([
            equip?.weapon_id,
            equip?.armor_id,
            equip?.accessory_id
        ].filter(Boolean));

        let eqBp = [];
        let matBp = [];

        backpackObjects.forEach(b => {
            const eqInf = itemsData.getItem(b.item_id);
            if (eqInf) {
                const isEquipped = equippedIds.has(b.item_id);
                const tag = isEquipped ? ' `[E]`' : '';
                eqBp.push(`\`[${eqInf.code}]\` **${eqInf.name}** [${eqInf.rarity}]${tag} (x${b.amount})`);
            } else {
                const matInf = materialsData.getMaterial(b.item_id);
                const conInf = shopData.consumables?.find(c => c.id === b.item_id);
                
                if (matInf) {
                    matBp.push(`**${matInf.name}** [${matInf.rarity || 'Common'}] (x${b.amount})`);
                } else if (conInf) {
                    matBp.push(`**${conInf.name}** [Tiêu hao] (x${b.amount})`);
                } else {
                    matBp.push(`**${b.item_id}** (x${b.amount})`);
                }
            }
        });

        const embed = new EmbedBuilder()
            .setTitle(`🎒 Túi Đồ: ${interaction.user.username}`)
            .setColor('#f1c40f')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

        if (filter === 'all' || filter === 'equipment') {
            embed.addFields({
                name: '⚔️ Vũ khí & Giáp trụ',
                value: eqBp.length > 0 ? eqBp.join('\n') : '*Trống*',
                inline: false
            });
        }

        if (filter === 'all' || filter === 'materials') {
            embed.addFields({
                name: '🛠️ Nguyên liệu',
                value: matBp.length > 0 ? matBp.join('\n') : '*Trống*',
                inline: false
            });
        }

        embed.setFooter({ text: '💡 [E] = Đang mặc | /equip [mã_số] để mặc/tháo | /dismantle [mã_id] để phân rã' });

        await interaction.reply({ embeds: [embed] });
    },
};
