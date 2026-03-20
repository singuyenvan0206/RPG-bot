const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database');
const itemsData = require('../../utils/itemsData');

module.exports = {
    category: 'RPG',
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Gửi yêu cầu giao dịch vật phẩm/vàng cho người chơi khác')
        .addUserOption(opt => opt.setName('user').setDescription('Người nhận').setRequired(true))
        .addStringOption(opt => opt.setName('item').setDescription('ID vật phẩm (để trống nếu chỉ chuyển vàng)'))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng vật phẩm (mặc định 1)').setMinValue(1))
        .addIntegerOption(opt => opt.setName('gold').setDescription('Số vàng muốn chuyển').setMinValue(0)),
    async execute(interaction) {
        const senderId = interaction.user.id;
        const receiver = interaction.options.getUser('user');
        const itemId = interaction.options.getString('item');
        const amount = interaction.options.getInteger('amount') || 1;
        const gold = interaction.options.getInteger('gold') || 0;

        if (receiver.id === senderId) return interaction.reply({ content: 'Bạn không thể giao dịch với chính mình!', flags: 64 });
        if (receiver.bot) return interaction.reply({ content: 'Bạn không thể giao dịch với Bot!', flags: 64 });

        const player = await db.getPlayer(senderId);
        if (gold > 0 && player.gold < gold) return interaction.reply({ content: `Bạn không đủ **${gold} Gold**!`, flags: 64 });

        let itemLabel = '';
        if (itemId) {
            const item = itemsData.getItem(itemId);
            if (!item) return interaction.reply({ content: 'Vật phẩm không tồn tại!', flags: 64 });
            
            const inv = await db.queryOne('SELECT amount FROM inventory WHERE user_id = $1 AND item_id = $2', [senderId, itemId]);
            if (!inv || inv.amount < amount) return interaction.reply({ content: `Bạn không đủ **${amount} ${item.name}**!`, flags: 64 });
            itemLabel = `${amount}x ${item.name}`;
        }

        if (!itemId && gold <= 0) return interaction.reply({ content: 'Bạn phải nhập ít nhất 1 loại tài sản để giao dịch!', flags: 64 });

        const tradeId = `tr_${Date.now()}_${senderId.substring(0, 4)}`;
        await db.execute('INSERT INTO trades (trade_id, sender_id, receiver_id, item_id, amount, gold) VALUES ($1, $2, $3, $4, $5, $6)', [tradeId, senderId, receiver.id, itemId, amount, gold]);

        const embed = new EmbedBuilder()
            .setTitle('🤝 Yêu Cầu Giao Dịch')
            .setDescription(`<@${senderId}> muốn gửi cho bạn:\n- **Vàng:** ${gold.toLocaleString()} Gold\n- **Vật phẩm:** ${itemLabel || 'Không có'}`)
            .setColor('#f39c12')
            .setFooter({ text: 'Nhấn Chấp Nhận để hoàn tất giao dịch.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`trade_accept_${tradeId}`).setLabel('Chấp Nhận').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`trade_decline_${tradeId}`).setLabel('Từ Chối').setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ content: `<@${receiver.id}>, bạn có một yêu cầu giao dịch!`, embeds: [embed], components: [row] });
    },
};
