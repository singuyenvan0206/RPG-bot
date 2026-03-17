const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const petsData = require('../../utils/petsData');
const equipCmd = require('./equip');

module.exports = {
    category: 'Economy',
    aliases: ['pets', 'pt'],
    data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('Hệ thống Thú Cưng Khế Ước')
        .addSubcommand(sub => 
            sub.setName('list')
               .setDescription('Xem danh sách thú cưng bạn đang sở hữu')
        )
        .addSubcommand(sub => 
            sub.setName('hatch')
               .setDescription('Ấp Trứng Thú Rừng lấy pet ngẫu nhiên (Tốn 1 trứng)')
        )
        .addSubcommand(sub => 
            sub.setName('equip')
               .setDescription('Trang bị hệ thống thú cưng đi theo hỗ trợ')
               .addIntegerOption(opt => opt.setName('pet_id').setDescription('ID của Pet trong danh sách').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('unequip')
               .setDescription('Cất thú cưng đi')
        ),
    help: {
        usage: '/pet <list|hatch|equip|unequip>',
        examples: ['/pet list', '/pet hatch', '/pet_equip pet_id:1', '$pets hatch'],
        description: 'Quản lý thú cưng của bạn. Bạn có thể ấp trứng (hatch) thu được từ Boss, xem danh sách thú cưng và trang bị chúng để nhận các chỉ số bổ trợ nội tại.'
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: require('discord.js').MessageFlags.Ephemeral });

        if (sub === 'list') {
            const myPets = await db.queryAll('SELECT * FROM player_pets WHERE user_id = $1 ORDER BY level DESC', [userId]);
            if (myPets.length === 0) {
                return interaction.reply({ content: '🥚 Bạn chưa có con thú cưng nào. Hãy tiêu diệt World Boss để săn trứng rớt!', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle('🐾 Vườn Thú Cưng của Bạn')
                .setColor('#2ecc71');

            myPets.forEach(p => {
                const info = petsData.getPet(p.pet_type);
                if (info) {
                    let buffTxt = Object.keys(info.buffs).map(k => `${k.toUpperCase()}: +${info.buffs[k]}`).join(' | ');
                    embed.addFields({
                        name: `ID: #${p.id} | ${info.name} [${info.rarity}] (Lv.${p.level})`,
                        value: `✨ Nội tại: ${buffTxt}\n📖 ${info.desc}`
                    });
                }
            });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'hatch') {
            const eggRow = await db.queryOne("SELECT * FROM inventory WHERE user_id = $1 AND item_id = 'egg' AND amount > 0", [userId]);
            if (!eggRow) {
                return interaction.reply({ content: '❌ Bạn không có `Trứng Thú Rừng` nào để ấp. (Đánh World Boss để nhặt trứng).', flags: require('discord.js').MessageFlags.Ephemeral });
            }

            // Consume egg
            if (eggRow.amount <= 1) {
                await db.execute('DELETE FROM inventory WHERE id = $1', [eggRow.id]);
            } else {
                await db.execute('UPDATE inventory SET amount = amount - 1 WHERE id = $1', [eggRow.id]);
            }

            // Roll pet
            const roll = Math.random();
            let hatchedPet = 'slime'; // 50%
            if (roll < 0.05) hatchedPet = 'void_wisp';     // 5% Legendary
            else if (roll < 0.20) hatchedPet = 'fire_drake'; // 15% Epic
            else if (roll < 0.50) hatchedPet = 'wolf_pup';   // 30% Rare
            
            await db.execute(
                'INSERT INTO player_pets (user_id, pet_type) VALUES ($1, $2)',
                [userId, hatchedPet]
            );

            const info = petsData.getPet(hatchedPet);
            const embed = new EmbedBuilder()
                .setTitle('🥚 Trứng Đã Nở!')
                .setColor('#f1c40f')
                .setDescription(`Chúc mừng! Bạn đã ấp thành công nở ra **${info.name}** [${info.rarity}].\n\nHãy dùng lệnh \`/pet equip\` để mang nó theo cùng phiêu lưu.`);

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'equip') {
            const petIdToEquip = interaction.options.getInteger('pet_id');
            const petRow = await db.queryOne('SELECT * FROM player_pets WHERE id = $1 AND user_id = $2', [petIdToEquip, userId]);
            if (!petRow) {
                return interaction.reply({ content: `❌ Bạn không sở hữu Pet mang ID #${petIdToEquip}. Dùng \`/pet list\` để xem ID.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const equipDb = await db.queryOne('SELECT * FROM player_equipment WHERE user_id = $1', [userId]);
            if (!equipDb) {
                await db.execute('INSERT INTO player_equipment (user_id, pet_id) VALUES ($1, $2)', [userId, petIdToEquip]);
            } else {
                await db.execute('UPDATE player_equipment SET pet_id = $1 WHERE user_id = $2', [petIdToEquip, userId]);
            }

            await equipCmd.recalculateStats(userId);
            
            const info = petsData.getPet(petRow.pet_type);
            return interaction.reply(`🐾 Bạn đã gọi **${info.name}** ra đồng hành! Thuộc tính của thú cưng sẽ được cộng dồn vào bạn.`);
        }

        if (sub === 'unequip') {
            await db.execute('UPDATE player_equipment SET pet_id = NULL WHERE user_id = $1', [userId]);
            await equipCmd.recalculateStats(userId);
            return interaction.reply(`💤 Bạn đã cất Thú cưng đi nghỉ ngơi.`);
        }
    }
};

