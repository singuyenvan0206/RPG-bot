const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    category: 'System',
    aliases: ['how', 'guide'],
    data: new SlashCommandBuilder()
        .setName('howtoplay')
        .setDescription('Cẩm nang hướng dẫn chơi trò chơi EchoWorld RPG toàn tập'),
    async execute(interaction) {
        
        const pages = [
            // Page 1: Basics
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 1. Cơ Bản')
                .setColor('#3498db')
                .setDescription('Chào mừng đến với **EchoWorld RPG**! Dưới đây là cách để bạn bắt đầu cuộc hành trình.')
                .addFields(
                    { name: 'Khởi đầu (`/start`)', value: 'Bạn sẽ bắt đầu là một **Tân Thủ (Novice)**. Hãy thám hiểm để đạt **Cấp 10**, sau đó dùng lại lệnh này để chọn 1 trong 4 Class: Chiến Binh, Xạ Thủ, Pháp Sư, Sát Thủ.' },
                    { name: 'Thám hiểm (`/explore`)', value: 'Lệnh quan trọng nhất! Bạn sẽ vượt qua các tầng quái vật. Số tầng tối đa bằng số loại quái vật x 3. Ở mỗi tầng, chắc chắn có quái vật trấn giữ và có tỷ lệ xuất hiện Rương hoặc Sự Kiện bí ẩn ngay trước đó.' },
                    { name: 'Túi đồ (`/inventory`)', value: 'Theo dõi lượng Máu, Mana, Cấp độ, và xem các vật phẩm/nguyên liệu nhặt được.' },
                    { name: 'Kĩ năng (`/skill`)', value: 'Học kĩ năng từ `/shop` và trang bị vào **3 slot** chiến đấu để gia tăng sức mạnh đột biến.' }
                ),

            // Page 2: World & Ecosystem
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 2. Hệ Sinh Thái')
                .setColor('#2ecc71')
                .setDescription('Vượt ra khỏi Rừng Nguyên Sinh, thế giới này còn rất nhiều thứ.')
                .addFields(
                    { name: 'Dịch chuyển (`/travel`)', value: 'Khi chinh phục xong vùng đất cũ, hãy di chuyển sang Vùng Đất mới. Quái vật mạnh hơn = Rớt đồ xịn hơn.' },
                    { name: 'Bang Hội (`/guild`)', value: 'Gia nhập Bang hội để cùng đồng đội chiếm đóng các khu vực qua hệ thống **Lãnh Thổ** (`/guild territory`). Tính năng Guild Wars sẽ sớm ra mắt!' },
                    { name: 'Săn World Boss (`/boss`)', value: 'Mỗi khu vực có 1 con Trùm. Cả máy chủ phải cùng nhau diệt đủ số lượng quái để dụ nó ra. Đánh bại Boss nhận phần thưởng vô giá!' }
                ),

            // Page 3: Expansion 1.0 (Crafting & Pets)
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 3. Lò Rèn & Thú Cưng')
                .setColor('#f1c40f')
                .setDescription('Nâng cấp trang bị và tìm kiếm bạn đồng hành.')
                .addFields(
                    { name: 'Phân Rã Đồ (`/dismantle`)', value: 'Biến các trang bị dư thừa thành Nguyên Liệu Rèn (Quặng sắt, Lõi phép, Mảnh hư không).' },
                    { name: 'Cường Hóa (`/forge`)', value: 'Mang Trang Bị + Vàng + Nguyên Liệu đến thợ rèn để đập lên [+1, +2,...]. Chỉ số sẽ tăng cực mạnh theo cấp cường hóa.' },
                    { name: 'Thú Cưng (`/pet`)', value: 'Ấp trứng rơi từ Boss để nhận Pet. Mang theo Pet cung cấp buff sức mạnh và thay đổi chỉ số trong thám hiểm.' }
                ),

            // Page 4: Daily Quests & Arena
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 4. Nhiệm Vụ & Đấu Trường')
                .setColor('#e74c3c')
                .setDescription('Tìm kiếm vinh quang thông qua thử thách.')
                .addFields(
                    { name: 'Nhiệm Vụ (`/quest`)', value: 'Hoàn thành 3 nhiệm vụ hằng ngày mỗi ngày để nhận cơn mưa EXP và Vàng.' },
                    { name: 'Đấu Trường PvP (`/arena`)', value: 'Quyết đấu với người chơi khác để leo Bảng Xếp Hạng. Hệ thống tính điểm **Elo** để phân chia thứ hạng từ Đồng đến Thách Đấu.' },
                    { name: 'Phần Thưởng Top', value: 'Những người đứng đầu bảng xếp hạng Elo sẽ nhận được danh hiệu và phần thưởng đặc biệt mỗi mùa.' }
                ),

            // Page 5: Activities & Fun
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 5. Hoạt Động & Giải Trí')
                .setColor('#9b59b6')
                .setDescription('Những cách khác để kiếm tài nguyên và thử vận may.')
                .addFields(
                    { name: 'Điểm Danh Hằng Ngày (`/daily`)', value: 'Nhận 500 Vàng và 200 EXP miễn phí mỗi 24 giờ. Đừng quên ghé thăm mỗi ngày!' },
                    { name: 'Khai Thác Mỏ (`/mine` & `/fish`)', value: 'Tiêu tốn Mana để đào quặng sắt, lõi phép, hoặc câu cá làm thực phẩm/bán lấy tiền.' },
                    { name: 'Giải Trí (`/slots` & `/flip`)', value: 'Thử vận may với các trò chơi cá cược để nhân đôi số vàng đang có.' }
                ),

            // Page 6: Skills System
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 6. Hệ Thống Kĩ Năng')
                .setColor('#9b59b6')
                .setDescription('Làm chủ sức mạnh nguyên tố và kĩ năng đặc trưng.')
                .addFields(
                    { name: 'Học Kĩ Năng', value: 'Mua sách kĩ năng trong `/shop`. Mỗi Class (Chiến binh, Pháp sư...) có bộ kĩ năng riêng biệt.' },
                    { name: 'Trang Bị Kĩ Năng', value: 'Sử dụng `/skill equip <id> <slot>` để lắp kĩ năng vào 1 trong **3 slot** chiến đấu.' },
                    { name: 'Cơ Chế Kích Hoạt', value: 'Kĩ năng chủ động (Mana) sẽ tự kích hoạt mỗi lượt khi bạn tấn công (`/explore`). Kĩ năng bị động sẽ buff chỉ số vĩnh viễn.' },
                    { name: 'Nguyên Tố', value: 'Các kĩ năng bị ảnh hưởng bởi khắc chế nguyên tố (Lửa, Nước, Gió, Đất, Ánh Sáng, Bóng Tối). Chọn đúng nguyên tố khắc chế, sát thương sẽ tăng cao.' }
                ),

            // Page 7: Market, Trade & Economy
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 7. Kinh Tế & Chợ')
                .setColor('#f39c12')
                .setDescription('Giao thương với người chơi khác để làm giàu.')
                .addFields(
                    { name: 'Chợ Giao Dịch (`/market list`)', value: 'Mua bán vật phẩm ngang giá. Dùng `/market sell` để đang bán món đồ dư thừa.' },
                    { name: 'Đấu Giá Cơ Bản (`auction: true`)', value: 'Một số món hiếm có thể lên Đấu Giá. Dùng lệnh `/market bid` để đấu giá với những người khác.' },
                    { name: 'Giao Dịch Trực Tiếp (`/trade`)', value: 'Dùng lệnh này để gửi Vàng hoặc Vật Phẩm trực tiếp cho người chơi khác với thuế phí thấp.' },
                    { name: '💡 Mẹo viết tắt số tiền', value: 'Ở bất kỳ lệnh liên quan đến nhập Vàng, bạn có thể dùng **k, m, b**. Ví dụ: `1k5` = 1500, `2m` = 2,000,000.' }
                ),

            // Page 8: Progression & Rebirth
            new EmbedBuilder()
                .setTitle('📖 Cẩm nang EchoWorld: 8. Chuyển Sinh Vĩnh Cửu')
                .setColor('#1abc9c')
                .setDescription('Vượt qua giới hạn của sinh tử để mạnh mẽ hơn bao giờ hết.')
                .addFields(
                    { name: 'Thức Tỉnh Sức Mạnh (`/rebirth`)', value: 'Khi nhân vật của bạn đạt đến **Cấp 100**, bạn có thể tiến hành Chuyển Sinh.' },
                    { name: 'Kết Quả Chuyển Sinh', value: 'Level của bạn sẽ quay về 1, tuy nhiên bạn sẽ nhận được một luồng sức mạnh mới cộng dồn (ví dụ: +10% mọi chỉ số và +1% Chí Mạng cho mỗi lần Chuyển Sinh).' },
                    { name: 'Tài Sản Hội Tụ', value: 'Túi đồ, Vàng, Trang bị đã rèn và thú cưng của bạn đều được giữ lại hoàn toàn sau khi Chuyển Sinh.' }
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
