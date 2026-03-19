const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    category: 'Owner',
    data: new SlashCommandBuilder()
        .setName('setlevel')
        .setDescription('[Owner Only] Đặt cấp độ cho người chơi (tự động scale stats)')
        .addUserOption(opt => opt.setName('user').setDescription('Người chơi').setRequired(true))
        .addIntegerOption(opt => opt.setName('level').setDescription('Cấp độ mới (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này!', flags: 64 });
        }

        const targetUser = interaction.options.getUser('user');
        const newLevel = interaction.options.getInteger('level');
        const userId = targetUser.id;

        const player = await db.getPlayer(userId);
        if (!player) {
            return interaction.reply({ content: `❌ Người dùng **${targetUser.username}** chưa tham gia RPG.`, flags: 64 });
        }

        // Base stats per class
        const baseStats = {
            'Warrior': { hp: 150, mana: 30, atk: 15, def: 15 },
            'Ranger':  { hp: 100, mana: 40, atk: 12, def: 8 },
            'Mage':    { hp: 80,  mana: 100, atk: 20, def: 5 },
            'Assassin':{ hp: 90,  mana: 40, atk: 18, def: 7 }
        };

        const stats = baseStats[player.class] || baseStats['Warrior'];
        const levelsGained = newLevel - 1;
        const finalMaxHp = stats.hp + (levelsGained * 20);
        const finalMaxMana = stats.mana + (levelsGained * 10);
        const finalAtk = stats.atk + (levelsGained * 2);
        const finalDef = stats.def + (levelsGained * 2);

        await db.execute(
            'UPDATE players SET level = $1, exp = 0, max_hp = $2, hp = $2, max_mana = $3, mana = $3 WHERE user_id = $4',
            [newLevel, finalMaxHp, finalMaxMana, userId]
        );

        await db.execute(
            'UPDATE player_stats SET attack = $1, defense = $2 WHERE user_id = $3',
            [finalAtk, finalDef, userId]
        );

        const embed = new EmbedBuilder()
            .setTitle('🆙 Đặt Cấp Độ')
            .setDescription(`Đã đặt cấp độ của **${targetUser.username}** thành **Lv.${newLevel}**.\nChỉ số đã được scale tự động theo class **${player.class}**.`)
            .setColor('#2ecc71')
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
