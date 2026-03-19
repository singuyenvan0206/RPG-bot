const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'Admin',
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('[ADMIN] Kích hoạt hoặc tắt Sự Kiện Toàn Server')
        .addStringOption(option => 
            option.setName('action')
                .setDescription('Bật hoặc Tắt sự kiện')
                .setRequired(true)
                .addChoices(
                    { name: 'Khởi động (Start)', value: 'start' },
                    { name: 'Kết thúc (Stop)', value: 'stop' }
                )
        )
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Loại sự kiện')
                .setRequired(false)
                .addChoices(
                    { name: 'Huyết Nguyệt (Blood Moon): Quái +20% HP/ATK, +50% Vàng', value: 'blood_moon' },
                    { name: 'Cơn Sốt Vàng (Gold Rush): +100% Vàng toàn cầu', value: 'gold_rush' },
                    { name: 'Ngày Khai Sáng (Enlightenment): +50% EXP toàn cầu', value: 'enlightenment' },
                    { name: 'Phước Lành Thần Linh (Divine Blessing): +15% Tỉ lệ rớt đồ, Quái yếu đi 10%', value: 'divine_blessing' }
                )
        ),
    ownerOnly: true,
    async execute(interaction) {
        const action = interaction.options.getString('action');
        
        if (action === 'stop') {
            await db.execute("UPDATE world_states SET value = 'none' WHERE key = 'global_event'");
            return interaction.reply({ content: '✅ Đã kết thúc sự kiện toàn máy chủ.' });
        }

        const type = interaction.options.getString('type');
        if (!type) {
            return interaction.reply({ content: '❌ Vui lòng chọn `type` khi muốn Khởi động sự kiện.', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        await db.execute(
            "INSERT INTO world_states (key, value) VALUES ('global_event', $1) ON CONFLICT (key) DO UPDATE SET value = $1", 
            [type]
        );

        const eventData = {
            blood_moon: { name: '🔴 HUYẾT NGUYỆT MẶT TRĂNG MÁU', desc: 'Màn đêm đỏ rực buông xuống. Quái vật trở nên điên cuồng (+20% HP/ATK) nhưng lượng Vàng rớt ra tăng 50%! Cẩn thận!' },
            gold_rush: { name: '⚜️ CƠN SỐT VÀNG', desc: 'Một mỏ vàng khổng lồ vừa được phát hiện tại vùng lõi trái đất. Toàn bộ lượng lượng Vàng tìm được tăng 100%!' },
            enlightenment: { name: '🌠 NGÀY KHAI SÁNG', desc: 'Vũ trụ mở ra cánh cổng tri thức. Toàn bộ người chơi nhận thêm 50% Kinh nghiệm (EXP)!' },
            divine_blessing: { name: '🕊️ PHƯỚC LÀNH THẦN LINH', desc: 'Các vị thần mỉm cười với EchoWorld. Quái vật suy yếu đi 10% và Tỉ lệ rớt đồ (Drop Rate) tăng thêm 15%!' }
        };

        const e = eventData[type];
        
        const embed = new EmbedBuilder()
            .setTitle(`📢 SỰ KIỆN TOÀN MÁY CHỦ: ${e.name}`)
            .setDescription(e.desc)
            .setColor(type === 'blood_moon' ? '#FF0000' : '#FFD700')
            .setTimestamp();

        return interaction.reply({ content: '@everyone', embeds: [embed] });
    }
};
