/**
 * Skill Data for each class.
 * Each class has multiple skills (passive & active).
 * 
 * Active skills:
 *   - chance: base trigger chance per hit
 *   - multiplier: damage multiplier
 *   - element: elemental damage type
 *   - effect: 'attack', 'heal', 'shield', 'dot' (damage over time)
 *   - dot_dmg: flat damage for dot effect
 *   - heal_pct: % of max HP healed (for heal effect)
 * 
 * Passive skills:
 *   - def_bonus, atk_bonus, agi_bonus, crit_bonus, mana_bonus: flat stat additions (per level)
 *   - true_dmg: flat true damage added to each attack
 */
module.exports = {
    Warrior: [
        // Tier 1 - Common
        {
            id: 'power_strike', code: 101,
            name: '⚔️ Power Strike', element: 'Physical',
            desc: 'Đòn chém mạnh mẽ gây 150% ATK. Nguyên tố: Vật Lý.',
            type: 'active', multiplier: 1.5, chance: 0.20, effect: 'attack',
            msg: 'trút xuống **đòn Power Strike** mãnh liệt!'
        },
        {
            id: 'shield_block', code: 102,
            name: '🛡️ Shield Block', element: 'None',
            desc: 'Bị động: 15% chặn 50% một đòn tấn công.',
            type: 'passive', def_bonus: 15, base_chance: 0.15
        },
        // Tier 2 - Rare
        {
            id: 'iron_wall', code: 103,
            name: '🧱 Iron Wall', element: 'Earth',
            desc: 'Bị động: Tăng DEF vĩnh viễn. Nguyên tố: Đất.',
            type: 'passive', def_bonus: 25
        },
        {
            id: 'earth_smash', code: 104,
            name: '⛰️ Earth Smash', element: 'Earth',
            desc: 'Dùng sức mạnh đất đai đập kẻ địch xuống đất, gây 180% ATK. Có thể làm choáng.',
            type: 'active', multiplier: 1.8, chance: 0.18, element: 'Earth', effect: 'attack',
            msg: 'gọi sức mạnh của **Earth Smash**!'
        },
        // Tier 3 - Epic
        {
            id: 'battle_cry', code: 105,
            name: '📣 Battle Cry', element: 'Physical',
            desc: 'Hét chiến đấu, tạm thời hồi HP 10% Max HP mỗi lần kích hoạt.',
            type: 'active', chance: 0.15, effect: 'heal', heal_pct: 0.10,
            msg: 'hét vang **Battle Cry** và hồi phục sinh lực!'
        },
        {
            id: 'fire_charge', code: 106,
            name: '🔥 Fire Charge', element: 'Fire',
            desc: 'Lao vào kẻ địch trong luồng lửa, gây 200% ATK hỏa hệ.',
            type: 'active', multiplier: 2.0, chance: 0.12, element: 'Fire', effect: 'attack',
            msg: 'lao vào với **Fire Charge** rực lửa!'
        },
        // Tier 4 - Legendary
        {
            id: 'avatar_of_war', code: 107,
            name: '⚡ Avatar of War', element: 'Physical',
            desc: 'Bị động: Tăng ATK+50 và DEF+50 vĩnh viễn.',
            type: 'passive', atk_bonus: 50, def_bonus: 50
        }
    ],

    Mage: [
        // Tier 1 - Common
        {
            id: 'fireball', code: 201,
            name: '🔥 Fireball', element: 'Fire',
            desc: 'Phóng cầu lửa gây 130% ATK hỏa hệ, 25% cơ hội kích hoạt.',
            type: 'active', multiplier: 1.3, chance: 0.25, element: 'Fire', effect: 'attack',
            msg: 'phóng **Fireball** bùng cháy!'
        },
        {
            id: 'arcane_intellect', code: 202,
            name: '🧠 Arcane Intellect', element: 'None',
            desc: 'Bị động: Tăng Mana tối đa +150.',
            type: 'passive', mana_bonus: 150
        },
        // Tier 2 - Rare
        {
            id: 'mana_overload', code: 203,
            name: '🔮 Mana Overload', element: 'Void',
            desc: 'Xả toàn bộ ma lực, gây 160% ATK hư không hệ.',
            type: 'active', multiplier: 1.6, chance: 0.20, element: 'Void', effect: 'attack',
            msg: 'khai mở **Mana Overload** hủy diệt!'
        },
        {
            id: 'ice_nova', code: 204,
            name: '🧊 Ice Nova', element: 'Water',
            desc: 'Bùng phát băng giá xung quanh, gây 140% ATK băng hệ.',
            type: 'active', multiplier: 1.4, chance: 0.22, element: 'Water', effect: 'attack',
            msg: 'tung **Ice Nova** đóng băng không gian!'
        },
        // Tier 3 - Epic
        {
            id: 'arcane_drain', code: 205,
            name: '💧 Arcane Drain', element: 'Void',
            desc: 'Hút sinh lực kẻ địch: gây 100% ATK và hồi 8% HP Max HP.',
            type: 'active', multiplier: 1.0, chance: 0.18, effect: 'drain', heal_pct: 0.08,
            msg: 'dùng **Arcane Drain** hút cạn sinh lực!'
        },
        {
            id: 'thunder_storm', code: 206,
            name: '⚡ Thunder Storm', element: 'Wind',
            desc: 'Gọi sấm sét tấn công kẻ địch, gây 220% ATK phong hệ.',
            type: 'active', multiplier: 2.2, chance: 0.10, element: 'Wind', effect: 'attack',
            msg: 'gọi xuống **Thunderstorm** của sấm sét!'
        },
        // Tier 4 - Legendary
        {
            id: 'archmage_focus', code: 207,
            name: '✨ Archmage Focus', element: 'Light',
            desc: 'Bị động: Tăng ATK+60 và Mana+200 vĩnh viễn.',
            type: 'passive', atk_bonus: 60, mana_bonus: 200
        }
    ],

    Ranger: [
        // Tier 1 - Common
        {
            id: 'double_shot', code: 301,
            name: '🏹 Double Shot', element: 'Physical',
            desc: 'Bắn hai mũi tên liên tiếp, gây 200% ATK tổng cộng.',
            type: 'active', multiplier: 2.0, chance: 0.15, effect: 'attack',
            msg: 'bắn **Double Shot** xuyên thấu!'
        },
        {
            id: 'eagle_eye', code: 302,
            name: '👁️ Eagle Eye', element: 'None',
            desc: 'Bị động: Tăng tỉ lệ bạo kích +8%.',
            type: 'passive', crit_bonus: 0.08
        },
        // Tier 2 - Rare
        {
            id: 'wind_walk', code: 303,
            name: '💨 Wind Walk', element: 'Wind',
            desc: 'Bị động: Tăng AGI +40, di chuyển như gió.',
            type: 'passive', agi_bonus: 40
        },
        {
            id: 'poison_arrow', code: 304,
            name: '🐍 Poison Arrow', element: 'Wood',
            desc: 'Bắn mũi tên tẩm độc, gây 80% ATK + 200 độc hệ theo thời gian.',
            type: 'active', multiplier: 0.8, dot_dmg: 200, chance: 0.25, element: 'Wood', effect: 'dot',
            msg: 'bắn **Poison Arrow** tẩm đầy nọc độc!'
        },
        // Tier 3 - Epic
        {
            id: 'explosive_shot', code: 305,
            name: '💥 Explosive Shot', element: 'Fire',
            desc: 'Mũi tên nổ tung khi trúng mục tiêu, gây 250% ATK hỏa hệ.',
            type: 'active', multiplier: 2.5, chance: 0.12, element: 'Fire', effect: 'attack',
            msg: 'bắn **Explosive Shot** nổ tung!'
        },
        {
            id: 'volley', code: 306,
            name: '🌧️ Volley', element: 'Physical',
            desc: 'Phóng mưa mũi tên, gây 180% ATK và tăng AGI+20 tạm thời.',
            type: 'active', multiplier: 1.8, chance: 0.15, effect: 'attack',
            msg: 'tung **Volley** mưa tên xuống đầu kẻ thù!'
        },
        // Tier 4 - Legendary
        {
            id: 'phantom_marksman', code: 307,
            name: '🌙 Phantom Marksman', element: 'Void',
            desc: 'Bị động: ATK+40, AGI+30, Crit+5%. Bóng tối hỗ trợ mỗi nhát bắn.',
            type: 'passive', atk_bonus: 40, agi_bonus: 30, crit_bonus: 0.05
        }
    ],

    Assassin: [
        // Tier 1 - Common
        {
            id: 'critical_strike', code: 401,
            name: '🗡️ Critical Strike', element: 'Physical',
            desc: 'Vồ lấy điểm yếu, gây 180% ATK với tỉ lệ chí mạng cao.',
            type: 'active', multiplier: 1.8, chance: 0.20, effect: 'attack',
            msg: 'chụp lấy **Critical Strike** vào điểm yếu!'
        },
        {
            id: 'shadow_cloak', code: 402,
            name: '🌑 Shadow Cloak', element: 'Void',
            desc: 'Bị động: Tăng DEF+10, AGI+20 nhờ bóng tối che phủ.',
            type: 'passive', def_bonus: 10, agi_bonus: 20
        },
        // Tier 2 - Rare
        {
            id: 'lethal_venom', code: 403,
            name: '🐍 Lethal Venom', element: 'Wood',
            desc: 'Bị động: Mỗi đòn tấn công có 10% gây thêm 100 độc.',
            type: 'passive', true_dmg: 100, chance: 0.10
        },
        {
            id: 'backstab', code: 404,
            name: '🔪 Backstab', element: 'Void',
            desc: 'Ngầm lách vào sau lưng gây 220% ATK hư không hệ bất ngờ.',
            type: 'active', multiplier: 2.2, chance: 0.15, element: 'Void', effect: 'attack',
            msg: 'đột kích **Backstab** từ bóng tối!'
        },
        // Tier 3 - Epic
        {
            id: 'death_mark', code: 405,
            name: '💀 Death Mark', element: 'Void',
            desc: 'Đánh dấu kẻ địch để chết, gây 280% ATK hư không hệ.',
            type: 'active', multiplier: 2.8, chance: 0.10, element: 'Void', effect: 'attack',
            msg: 'khắc **Death Mark** lên kẻ địch!'
        },
        {
            id: 'smoke_bomb', code: 406,
            name: '💨 Smoke Bomb', element: 'Wind',
            desc: 'Ném bom khói hồi 12% HP Max và né đòn tấn công tiếp theo.',
            type: 'active', chance: 0.18, effect: 'heal', heal_pct: 0.12,
            msg: 'ném **Smoke Bomb** và biến vào bóng tối!'
        },
        // Tier 4 - Legendary
        {
            id: 'shadow_realm', code: 407,
            name: '🌌 Shadow Realm', element: 'Void',
            desc: 'Bị động: ATK+50, Crit+10%. Bạn sống trong bóng tối.',
            type: 'passive', atk_bonus: 50, crit_bonus: 0.10
        }
    ]
};
