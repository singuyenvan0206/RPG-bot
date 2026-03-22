module.exports = {
    pets: {
        // Common
        egg: { code: 4001, id: 'egg', name: '🥚 Trứng Thú Rừng', rarity: 'Common', image: 'egg.png', desc: 'Một quả trứng bí ẩn. Cần ấp để xem bên trong có gì.' },
        slime: { code: 4011, id: 'slime', name: '🟢 Slime Đàn Hồi', rarity: 'Common', buffs: { hp: 50, def: 10 }, explore_buffs: { gold_mult: 1.05 }, image: 'slime.png', desc: 'Slime nhỏ giúp đỡ vài đòn đánh. Thám hiểm: +5% Gold.' },
        sand_turtle: { code: 4009, id: 'sand_turtle', name: '🐢 Rùa Sa Mạc', rarity: 'Common', buffs: { def: 30, hp: 20 }, explore_buffs: { def_mult: 1.05 }, image: 'sand_turtle.png', desc: 'Lớp bảo vệ vững chắc. Thám hiểm: +5% Defense.' },
        rock_crab: { code: 4012, id: 'rock_crab', name: '🦀 Cua Đá', rarity: 'Common', buffs: { def: 15, hp: 40 }, explore_buffs: { def_mult: 1.03 }, image: 'rock_crab.png', desc: 'Vỏ cứng và trung thành. Thám hiểm: +3% Defense.' },

        // Rare
        wolf_pup: { code: 4013, id: 'wolf_pup', name: '🐺 Sói Con Răng Kiếm', rarity: 'Rare', buffs: { atk: 15, agi: 10 }, explore_buffs: { item_roll_bonus: 0.05 }, image: 'wolf_pup.png', desc: 'Hung hăng và cực kỳ nhanh nhẹn. Thám hiểm: +5% Tỉ lệ nhặt đồ.' },
        ice_cat: { code: 4014, id: 'ice_cat', name: '❄️ Mèo Băng Giá', rarity: 'Rare', buffs: { agi: 20, def: 5 }, explore_buffs: { agi_mult: 1.1 }, image: 'ice_cat.png', desc: 'Bước đi không tiếng động. Thám hiểm: +10% Agility.' },
        electric_mouse: { code: 4015, id: 'electric_mouse', name: '⚡ Chuột Điện Quang', rarity: 'Rare', buffs: { agi: 15, crit: 0.03 }, explore_buffs: { exp_mult: 1.1 }, image: 'electric_mouse.png', desc: 'Nhanh như chớp. Thám hiểm: +10% EXP.' },
        forest_owl: { code: 4016, id: 'forest_owl', name: '🦉 Cú Rừng', rarity: 'Rare', buffs: { agi: 10, crit: 0.05 }, explore_buffs: { crit_mult: 1.1 }, image: 'forest_owl.png', desc: 'Tầm nhìn ban đêm. Thám hiểm: +10% Crit Chance.' },

        // Epic
        fire_drake: { code: 4017, id: 'fire_drake', name: '🐲 Rồng Lửa Nhí', rarity: 'Epic', buffs: { atk: 30, crit: 0.05 }, explore_buffs: { atk_mult: 1.15 }, image: 'fire_drake.png', desc: 'Phun lửa hỗ trợ. Thám hiểm: +15% Attack.' },
        shadow_beast: { code: 4018, id: 'shadow_beast', name: '🌑 Thú Bóng Ma', rarity: 'Epic', buffs: { atk: 25, crit: 0.08 }, explore_buffs: { crit_mult: 1.2 }, image: 'shadow_beast.png', desc: 'Biến mất trong chớp mắt. Thám hiểm: +20% Crit Chance.' },
        crystal_butterfly: { code: 4019, id: 'crystal_butterfly', name: '🦋 Bướm Tinh Thể', rarity: 'Epic', buffs: { hp: 200, def: 30 }, explore_buffs: { heal_per_floor: 0.03 }, image: 'crystal_butterfly.png', desc: 'Vảy cánh bảo vệ. Thám hiểm: Hồi 3% HP mỗi tầng.' },

        // Legendary
        void_wisp: { code: 4020, id: 'void_wisp', name: '✨ Tinh Linh Hư Không', rarity: 'Legendary', buffs: { atk: 50, def: 50, crit: 0.1 }, explore_buffs: { exp_mult: 1.3 }, image: 'void_wisp.png', desc: 'Ánh sáng ma mị. Thám hiểm: +30% EXP.' },
        phoenix_chick: { code: 4021, id: 'phoenix_chick', name: '🔥 Phượng Hoàng Non', rarity: 'Legendary', buffs: { atk: 40, hp: 100 }, explore_buffs: { heal_per_floor: 0.08 }, image: 'phoenix_chick.png', desc: 'Hơi ấm vĩnh cửu. Thám hiểm: Hồi 8% HP mỗi tầng.' },
        ancient_dragon: { code: 4022, id: 'ancient_dragon', name: '🐉 Long Thần Cổ Đại', rarity: 'Legendary', buffs: { atk: 100, hp: 200, crit: 0.05 }, explore_buffs: { reward_mult: 1.25 }, image: 'ancient_dragon.png', desc: 'Vị vua bầu trời. Thám hiểm: +25% Toàn bộ phần thưởng.' },

        // Divine
        cosmic_serpent: { code: 4023, id: 'cosmic_serpent', name: '🌌 Mãng Xà Vũ Trụ', rarity: 'Divine', buffs: { atk: 200, def: 200, hp: 1000, crit: 0.15 }, explore_buffs: { reward_mult: 1.5, heal_per_floor: 0.1 }, image: 'cosmic_serpent.png', desc: 'Nắm giữ sức mạnh tối thượng. Thám hiểm: +50% Phần thưởng & Hồi 10% HP.' },
        light_bringer: { code: 4024, id: 'light_bringer', name: '✨ Sứ Giả Ánh Sáng', rarity: 'Divine', buffs: { atk: 150, agi: 100, hp: 2000, crit: 0.20 }, explore_buffs: { reward_mult: 2.0 }, image: 'light_bringer.png', desc: 'Ban phước lành vĩnh cửu. Thám hiểm: X2 Toàn bộ phần thưởng.' }
    }
};

module.exports.getPet = function(petId) {
    if (this.pets[petId]) return this.pets[petId];
    // Numeric lookup
    for (const key in this.pets) {
        if (this.pets[key].code == petId) return this.pets[key];
    }
    return null;
};

module.exports.getAllPets = function() {
    return this.pets;
};
