const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const skillsData = require('../../utils/skillsData');

const MAX_EQUIPPED_SKILLS = 3;

module.exports = {
    category: 'RPG',
    aliases: ['sk'],
    data: new SlashCommandBuilder()
        .setName('skill')
        .setDescription('Quản lý kĩ năng chiến đấu')
        .addSubcommand(sub =>
            sub.setName('list')
               .setDescription('Xem danh sách kĩ năng đã học')
        )
        .addSubcommand(sub =>
            sub.setName('equip')
               .setDescription('Trang bị kĩ năng vào 1 trong 3 slot chiến đấu')
               .addStringOption(o =>
                   o.setName('skill_id').setDescription('ID hoặc mã số của kĩ năng muốn trang bị').setRequired(true)
               )
               .addIntegerOption(o =>
                   o.setName('slot').setDescription('Slot muốn trang bị (1, 2 hoặc 3)').setMinValue(1).setMaxValue(3).setRequired(true)
               )
        )
        .addSubcommand(sub =>
            sub.setName('unequip')
               .setDescription('Bỏ kĩ năng ra khỏi slot')
               .addIntegerOption(o =>
                   o.setName('slot').setDescription('Slot muốn bỏ kĩ năng (1, 2 hoặc 3)').setMinValue(1).setMaxValue(3).setRequired(true)
               )
        ),
    help: {
        usage: '/skill list | /skill equip <skill_id> <slot> | /skill unequip <slot>',
        examples: ['/skill list', '/skill equip 101 1', '/skill unequip 2'],
        description: 'Học và trang bị kĩ năng. Mỗi người chơi được trang bị tối đa 3 kĩ năng cùng lúc vào chiến đấu.'
    },
    async execute(interaction) {
        const { MessageFlags } = require('discord.js');
        const userId = interaction.user.id;
        const sub = interaction.options.getSubcommand(false) || 'list';

        const player = await db.getPlayer(userId);
        if (!player) return interaction.reply({ content: '❌ Bạn chưa có nhân vật!', flags: MessageFlags.Ephemeral });

        const classSkills = skillsData[player.class] || [];
        const learnedSkills = await db.getPlayerSkills(userId);
        const learnedMap = {};
        learnedSkills.forEach(ls => { learnedMap[ls.skill_id] = ls; });

        // Get equipped skill slots (stored in player_skills as equipped_slot 1/2/3)
        const equippedSlots = {};
        learnedSkills.forEach(ls => {
            if (ls.equipped_slot) equippedSlots[ls.equipped_slot] = ls.skill_id;
        });

        if (sub === 'list') {
            const embed = new EmbedBuilder()
                .setTitle(`🔮 Kĩ Năng Của ${player.class}`)
                .setColor('#9b59b6')
                .setDescription(
                    `Bạn có thể học kĩ năng từ **/shop**.\n` +
                    `Trang bị tối đa **${MAX_EQUIPPED_SKILLS} kĩ năng** vào chiến đấu qua lệnh **/skill equip**.\n\n` +
                    `**Slot đang trang bị:**\n` +
                    `🥇 Slot 1: ${getSlotDisplay(1, equippedSlots, classSkills)}\n` +
                    `🥈 Slot 2: ${getSlotDisplay(2, equippedSlots, classSkills)}\n` +
                    `🥉 Slot 3: ${getSlotDisplay(3, equippedSlots, classSkills)}`
                );

            if (learnedSkills.length === 0) {
                embed.addFields({ name: '📚 Kĩ năng đã học', value: '*Chưa học kĩ năng nào. Hãy ra /shop mua sách kĩ năng!*' });
            } else {
                // Show all class skills
                const learnedText = classSkills.map(s => {
                    const learned = learnedMap[s.id];
                    if (!learned) return `\`[${s.code}]\` **${s.name}** — *Chưa học*`;

                    const equippedSlot = learned.equipped_slot ? `🎯 Slot ${learned.equipped_slot}` : '⬜ Chưa trang bị';
                    const elStr = s.element && s.element !== 'None' ? ` [${s.element}]` : '';
                    const typeStr = s.type === 'passive' ? '🔵 Bị Động' : '🔴 Chủ Động';
                    return `\`[${s.code}]\` **${s.name}**${elStr} ${typeStr} Lv.${learned.level} — ${equippedSlot}`;
                }).join('\n');

                embed.addFields({ name: `📚 Tất Cả Kĩ Năng (${player.class})`, value: learnedText });
            }

            embed.setFooter({ text: '💡 /skill equip [id] [slot] để trang bị | /shop để mua sách kĩ năng' });
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'equip') {
            const skillInput = interaction.options.getString('skill_id');
            const slot = interaction.options.getInteger('slot');

            // Find the skill
            const skillData = classSkills.find(s =>
                s.id === skillInput || String(s.code) === String(skillInput)
            );
            if (!skillData) {
                return interaction.reply({ content: `❌ Kĩ năng \`${skillInput}\` không thuộc class **${player.class}** hoặc không tồn tại.`, flags: MessageFlags.Ephemeral });
            }

            const learned = learnedMap[skillData.id];
            if (!learned) {
                return interaction.reply({ content: `❌ Bạn chưa học kĩ năng **${skillData.name}**. Hãy mua sách kĩ năng trong /shop!`, flags: MessageFlags.Ephemeral });
            }

            // Check if skill is already in another slot
            if (learned.equipped_slot && learned.equipped_slot !== slot) {
                // Move it
                await db.execute('UPDATE player_skills SET equipped_slot = NULL WHERE user_id = $1 AND equipped_slot = $2', [userId, slot]);
                await db.execute('UPDATE player_skills SET equipped_slot = $1 WHERE user_id = $2 AND skill_id = $3', [slot, userId, skillData.id]);
            } else {
                // Clear the target slot first, then equip
                await db.execute('UPDATE player_skills SET equipped_slot = NULL WHERE user_id = $1 AND equipped_slot = $2', [userId, slot]);
                await db.execute('UPDATE player_skills SET equipped_slot = $1 WHERE user_id = $2 AND skill_id = $3', [slot, userId, skillData.id]);
            }

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setDescription(`✅ Đã trang bị **${skillData.name}** vào **Slot ${slot}**!\n\nKĩ năng sẽ được kích hoạt tự động trong chiến đấu.`);
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'unequip') {
            const slot = interaction.options.getInteger('slot');
            const currentSkillId = equippedSlots[slot];
            if (!currentSkillId) {
                return interaction.reply({ content: `❌ Slot ${slot} đang trống.`, flags: MessageFlags.Ephemeral });
            }

            await db.execute('UPDATE player_skills SET equipped_slot = NULL WHERE user_id = $1 AND equipped_slot = $2', [userId, slot]);
            const skillInfo = classSkills.find(s => s.id === currentSkillId);

            const embed = new EmbedBuilder()
                .setColor('#95a5a6')
                .setDescription(`✅ Đã tháo **${skillInfo?.name || currentSkillId}** ra khỏi **Slot ${slot}**.`);
            return interaction.reply({ embeds: [embed] });
        }
    }
};

function getSlotDisplay(slot, equippedSlots, classSkills) {
    const skillId = equippedSlots[slot];
    if (!skillId) return '*Trống*';
    const s = classSkills.find(sk => sk.id === skillId);
    return s ? `**${s.name}**` : skillId;
}
