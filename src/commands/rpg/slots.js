const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const { parseAmount } = require('../../utils/numberHelper');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'Gambling',
    aliases: ['sl', 'slot'],
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Thử vận may với máy quay Slots')
        .addStringOption(opt => 
            opt.setName('bet')
               .setDescription('Số vàng muốn đặt cược (Ví dụ: 100, 10k, 1m). Mặc định: 50')
               .setRequired(false)
        ),
    help: {
        usage: '/slots [bet]',
        examples: ['/slots bet:100', '$sl 500', '$sl'],
        description: 'Đặt cược vàng để quay máy Slots. Nếu không nhập số tiền, bot sẽ tự cược mức tối thiểu là 50 Vàng.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const MIN_BET = 50;
        const betStr = interaction.options.getString('bet');
        let bet = betStr ? parseAmount(betStr) : null;

        // Auto-default to minbet if not provided
        if (bet === null || bet === undefined) {
            bet = MIN_BET;
        }

        if (isNaN(bet) || bet < MIN_BET) {
            return interaction.reply({
                content: `❌ Số tiền cược phải là số và tối thiểu là **${MIN_BET}** Vàng!`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({
                content: '❌ Bạn chưa tham gia thế giới này!',
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        if (player.gold < bet) {
            return interaction.reply({
                content: `❌ Bạn không đủ vàng! (Bạn hiện có **${player.gold}** Vàng).`,
                flags: require('discord.js').MessageFlags.Ephemeral
            });
        }

        const emojis = ['🍎', '💎', '🔔', '🍇', '🍋', '⭐'];
        const reel1 = emojis[Math.floor(Math.random() * emojis.length)];
        const reel2 = emojis[Math.floor(Math.random() * emojis.length)];
        const reel3 = emojis[Math.floor(Math.random() * emojis.length)];

        // Animation
        const embed = new EmbedBuilder()
            .setTitle('🎰 Máy Quay May Mắn')
            .setColor('#3498db')
            .setDescription('Các guồng quay đang bắt đầu xoay nhanh...')
            .setImage(gifData.slots);

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        await sleep(3000); // GIF duration

        let win = false;
        let multiplier = 0;

        if (reel1 === reel2 && reel2 === reel3) {
            win = true;
            multiplier = 5; // Jackpot
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            win = true;
            multiplier = 2; // Pair
        }

        let resultMsg = '';
        let finalGold = Number(player.gold);

        if (win) {
            const winnings = bet * multiplier;
            finalGold += winnings;
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [winnings, userId]);
            resultMsg = `🎉 **THẮNG RỒI!** Bạn nhận được **${winnings} Vàng** (x${multiplier})`;
        } else {
            finalGold -= bet;
            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [bet, userId]);
            resultMsg = '💀 **THẤT BẠI!** Bạn đã mất số tiền đặt cược.';
        }

        const finalEmbed = new EmbedBuilder()
            .setTitle('🎰 Máy Quay May Mắn')
            .setDescription(`**[ ${reel1} | ${reel2} | ${reel3} ]**\n\n${resultMsg}\n💰 Tài sản hiện tại: **${finalGold}** Vàng`)
            .setColor(win ? '#f1c40f' : '#e74c3c')
            .setTimestamp();

        return msg.edit({ embeds: [finalEmbed] });
    },
};
