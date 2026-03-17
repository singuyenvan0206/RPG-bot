const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    category: 'System',
    aliases: ['how', 'guide'],
    data: new SlashCommandBuilder()
        .setName('howtoplay')
        .setDescription('Cẩm nang hướng dẫn chơi trò chơi EchoWorld RPG toàn tập'),
    async execute(interaction) {
        
        const currentEmbed = new EmbedBuilder()
            .setTitle('📖 Cẩm nang EchoWorld: Menu Chính')
            .setColor('#ffffff')
            .setDescription('Hướng dẫn chi tiết về thế giới mở này. Nhấn các nút Điều hướng bên dưới.');

        const pages = [
            // Page 1: Basics
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 1. Cơ Bản')
                .setColor('#3498db')
                .setDescription('Chào mừng đến với **EchoWorld RPG**! Dưới đây là cách để bạn bắt đầu cuộc hành trình.')
                .addFields(
                    { name: 'Khởi đầu (`/start`)', value: 'Sử dụng lệnh này để tạo nhân vật và chọn 1 trong 4 Class: Chiến Binh, Xạ Thủ, Pháp Sư, Sát Thủ.' },
                    { name: 'Thám hiểm (`/explore`)', value: 'Lệnh quan trọng nhất! Dùng để đi bộ trong khu vực hiện tại. Bạn có 70% gặp quái vật và 30% kích hoạt Sự Kiện Ngoại Khóa.' },
                    { name: 'Túi đồ & Chỉ số (`/inventory`)', value: 'Theo dõi lượng Máu (HP), Mana, Cấp độ, Điểm Kinh Nghiệm (EXP), và xem bạn đang nhặt được những món đồ / nguyên liệu nào.' },
                    { name: 'Mặc Đồ (`/equip`)', value: 'Mặc Vũ Khí, Áo Giáp, Phụ Kiện để tăng Sát Thương (ATK), Phòng Thủ (DEF), Tốc Độ (AGI) và Chí Mạng (CRIT).' }
                ),

            // Page 2: World & Ecosystem
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 2. Hệ Sinh Thái')
                .setColor('#2ecc71')
                .setDescription('Vượt ra khỏi Rừng Nguyên Sinh, thế giới này còn rất nhiều thứ.')
                .addFields(
                    { name: 'Dịch chuyển (`/travel`)', value: 'Khi đủ cấp độ hoặc tự tin, dùng lệnh này để di chuyển sang các Vùng Đất mới (Sa Mạc, Núi Tuyết, Biển Sâu...). Quái vật mạnh hơn = Rớt đồ xịn hơn.' },
                    { name: 'Chợ Đen (`/market`)', value: 'Bạn có thể bán các trang bị xịn kiếm được cho người chơi khác với giá Vàng do bạn tự đặt ra, hoặc lướt chợ để mua đồ rẻ.' },
                    { name: 'Bang Hội (`/guild`)', value: 'Đóng góp 1000 Vàng để tự lập Bang Hội riêng hoặc gia nhập Bang của người khác.' },
                    { name: 'Săn World Boss (`/boss`)', value: 'Mỗi khu vực có 1 con Trùm. Cả máy chủ phải cùng nhau diệt đủ số lượng quái vật theo yêu cầu để dụ nó ra. Đánh bại Boss nhận phần thưởng vô giá!' }
                ),

            // Page 3: Expansion 1.0 (Crafting & Pets)
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 3. Lò Rèn & Thú Cưng')
                .setColor('#f1c40f')
                .setDescription('Bản cập nhật Expansion 1.0 mang đến sức mạnh mới.')
                .addFields(
                    { name: 'Phân Rã Đồ (`/dismantle`)', value: 'Biến các trang bị dư thừa thành Nguyên Liệu Rèn (Quặng sắt, Lõi phép, Mảnh hư không).' },
                    { name: 'Cường Hóa (`/forge`)', value: 'Mang Trang Bị Đang Mặc + Vàng + Nguyên Liệu đến thợ rèn để đập lên [+1, +2,...]. Đồ càng cao đập càng tốn kém nhưng chỉ số càng khủng.' },
                    { name: 'Ấp Trứng Thú (`/pet hatch`)', value: 'World Boss có tỷ lệ rớt Trứng Thú Rừng. Ấp nó để sinh ra các Thú Cưng ngẫu nhiên siêu hiếm.' },
                    { name: 'Trang bị Pet (`/pet equip`)', value: 'Mang thú cưng đi theo để nó cộng hưởng Nội Tại (Buff Máu, Tăng Chí Mạng, Giáp) vào sát thương của bạn.' }
                ),

            // Page 4: Daily Quests & Arena
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 4. Nhiệm Vụ & Đấu Trường')
                .setColor('#e74c3c')
                .setDescription('Tìm kiếm vinh quang và tiền tài.')
                .addFields(
                    { name: 'Nhận Nhiệm Vụ (`/quest list`)', value: 'Mỗi ngày bạn sẽ được Hội Thợ Săn giao 3 nhiệm vụ (Ví dụ: Giết 15 quái, Săn Boss, Kiếm 5000 Vàng). Hệ thống tự đếm tiến độ khi bạn chơi.' },
                    { name: 'Trả Nhiệm Vụ (`/quest claim`)', value: 'Nhận cơn mưa EXP và Vàng khi thanh tiến độ Nhiệm vụ đạt 100%.' },
                    { name: 'Xếp hạng PVP (`/arena rank`)', value: 'Bảng xếp hạng những kẻ mạnh nhất EchoWorld tính theo điểm Elo.' },
                    { name: 'Đấu Trường Sinh Tử (`/arena match`)', value: 'Hệ thống tự ghép bạn với một người chơi có Elo ngang ngửa bạn. Các chỉ số hai bên sẽ tự động gầm rú và chiến đấu trong 10 hiệp. Kẻ thắng lấy Elo kẻ thất bại!' }
                ),

            // Page 5: Activities & Fun
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 5. Hoạt Động & Giải Trí')
                .setColor('#9b59b6')
                .setDescription('Những cách khác để kiếm tài nguyên và thử vận may.')
                .addFields(
                    { name: 'Điểm Danh Hằng Ngày (`/daily`)', value: 'Nhận 500 Vàng và 200 EXP miễn phí mỗi 24 giờ. Đừng quên ghé thăm mỗi ngày!' },
                    { name: 'Khai Thác Mỏ (`/mine`)', value: 'Tiêu tốn 10 Mana để đào quặng (Sắt, Lõi Phép, Mảnh Hư Không). Rất quan trọng để thu thập nguyên liệu rèn đồ.' },
                    { name: 'Câu Cá (`/fish`)', value: 'Buông cần tại các vùng nước để bắt Cá Chép, Cá Hồi... Mỗi lần câu tốn 5 Mana.' },
                    { name: 'Máy Quay Slots (`/slots`)', value: 'Đặt cược Vàng và quay máy. Trúng 2 hoặc 3 biểu tượng để nhận thưởng gấp bội.' },
                    { name: 'Tung Đồng Xu (`/flip`)', value: 'Cá cược 50/50 với mặt Ngửa (Heads) hoặc Sấp (Tails). Thắng nhận x2 số tiền!' }
                )
        ];

        let currentPage = 0;

        const getRow = (pageIdx) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('⬅️ Trước')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIdx === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Sau ➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIdx === pages.length - 1)
                );
        };

        const message = await interaction.reply({
            embeds: [pages[currentPage]],
            components: [getRow(currentPage)],
            fetchReply: true
        });

        // Setup button collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 1 minute active window
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Sách của ai người nấy đọc nhé!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            if (i.customId === 'prev_page') {
                currentPage--;
            } else if (i.customId === 'next_page') {
                currentPage++;
            }

            await i.update({
                embeds: [pages[currentPage]],
                components: [getRow(currentPage)]
            });
        });

        collector.on('end', () => {
             // Disable buttons after timeout
             const disabledRow = new ActionRowBuilder()
             .addComponents(
                 new ButtonBuilder()
                     .setCustomId('prev_page')
                     .setLabel('⬅️ Trước')
                     .setStyle(ButtonStyle.Primary)
                     .setDisabled(true),
                 new ButtonBuilder()
                     .setCustomId('next_page')
                     .setLabel('Sau ➡️')
                     .setStyle(ButtonStyle.Primary)
                     .setDisabled(true)
             );
             message.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};

