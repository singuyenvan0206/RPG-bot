const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const { parseAmount } = require('../../utils/numberHelper');
const gifData = require('../../utils/gifData');

module.exports = {
    category: 'Gambling',
    aliases: ['cf', 'coinflip'],
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Đặt cược vàng vào trò chơi Tung Đồng Xu')
        .addStringOption(opt =>
            opt.setName('side')
               .setDescription('Chọn mặt đồng xu')
               .setRequired(true)
               .addChoices(
                   { name: 'Mặt Ngửa (Heads)', value: 'heads' },
                   { name: 'Mặt Sấp (Tails)', value: 'tails' }
               )
        )
        .addStringOption(opt => 
            opt.setName('bet')
               .setDescription('Số vàng muốn đặt cược (Ví dụ: 100, 10k, 1m). Mặc định: 50')
               .setRequired(false)
        ),
    help: {
        usage: '/flip [bet] <side>',
        examples: ['/flip bet:200 side:heads', '$cf 500 tails', '$cf tails'],
        description: 'Đặt cược vàng và chọn mặt đồng xu. Nếu không nhập số tiền, bot sẽ tự cược mức tối thiểu là 50 Vàng.'
    },
    async execute(interaction) {
        const userId = interaction.user.id;
        const MIN_BET = 50;
        const betStr = interaction.options.getString('bet');
        let bet = betStr ? parseAmount(betStr) : null;
        const side = interaction.options.getString('side');

        // Auto-default to minbet if not provided
        if (bet === null || bet === undefined) {
            bet = MIN_BET;
        }

        if (isNaN(bet) || bet < MIN_BET) {
            return interaction.reply({ content: `❌ Tiền cược phải là số và tối thiểu là **${MIN_BET}** Vàng!`, flags: require('discord.js').MessageFlags.Ephemeral });
        }

        if (!side) {
            return interaction.reply({ content: '❌ Bạn phải chọn một mặt (heads hoặc tails)!', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        const player = await db.getPlayer(userId);
        if (!player || player.gold < bet) {
            return interaction.reply({ content: '❌ Bạn không đủ vàng!', flags: require('discord.js').MessageFlags.Ephemeral });
        }

        // Animation
        const embed = new EmbedBuilder()
            .setTitle('🪙 Tung Đồng Xu')
            .setColor('#f1c40f')
            .setDescription('Đồng xu đang xoay tít trên không trung...')
            .setImage(gifData.flip);

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await sleep(2500); // Coin flip GIF wait

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const win = result === side;
        const resultLabel = result === 'heads' ? 'Mặt Ngửa (Heads)' : 'Mặt Sấp (Tails)';

        let finalGold = Number(player.gold);
        if (win) {
            finalGold += bet;
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [bet, userId]);
        } else {
            finalGold -= bet;
            await db.execute('UPDATE players SET gold = gold - $1 WHERE user_id = $2', [bet, userId]);
        }

        const finalEmbed = new EmbedBuilder()
            .setTitle('🪙 Kết Quả Tung Đồng Xu')
            .setDescription(`Đồng xu hiện ra là: **${resultLabel}**\n\n${win ? '🎉 **BẠN ĐÃ THẮNG!** Nhận được x2 tiền cược.' : '💀 **BẠN ĐÃ THUA!** Mất hết tiền cược.'}\n💰 Vàng hiện tại: **${finalGold}**`)
            .setColor(win ? '#2ecc71' : '#e74c3c')
            .setTimestamp();

        return msg.edit({ embeds: [finalEmbed] });
    },
};
