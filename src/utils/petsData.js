module.exports = {
    pets: {
        // Common
        egg: { code: 4001, id: 'egg', name: '🥚 Trứng Thú Rừng', rarity: 'Common', desc: 'Một quả trứng bí ẩn. Cần ấp để xem bên trong có gì.' },
        slime: { code: 4011, id: 'slime', name: '🟢 Slime Đàn Hồi', rarity: 'Common', buffs: { hp: 50, def: 10 }, desc: 'Nhỏ nhõn nhẽo nhưng giúp bạn đỡ vài đòn đánh.' },
        sand_turtle: { code: 4009, id: 'sand_turtle', name: '🐢 Rùa Sa Mạc', rarity: 'Common', buffs: { def: 30, hp: 20 }, desc: 'Lớp bảo vệ vững chắc như vách đá.' },
        rock_crab: { code: 4012, id: 'rock_crab', name: '🦀 Cua Đá', rarity: 'Common', buffs: { def: 15, hp: 40 }, desc: 'Vỏ cứng và rất trung thành.' },

        // Rare
        wolf_pup: { code: 4013, id: 'wolf_pup', name: '🐺 Sói Con Răng Kiếm', rarity: 'Rare', buffs: { atk: 15, agi: 10 }, desc: 'Hung hăng và cực kỳ nhanh nhẹn.' },
        ice_cat: { code: 4014, id: 'ice_cat', name: '❄️ Mèo Băng Giá', rarity: 'Rare', buffs: { agi: 20, def: 5 }, desc: 'Bước đi không tiếng động trên nền tuyết.' },
        electric_mouse: { code: 4015, id: 'electric_mouse', name: '⚡ Chuột Điện Quang', rarity: 'Rare', buffs: { agi: 15, crit: 0.03 }, desc: 'Nhanh như chớp và cực kỳ nghịch ngợm.' },
        forest_owl: { code: 4016, id: 'forest_owl', name: '🦉 Cú Rừng', rarity: 'Rare', buffs: { agi: 10, crit: 0.05 }, desc: 'Tầm nhìn ban đêm giúp phát hiện điểm yếu.' },

        // Epic
        fire_drake: { code: 4017, id: 'fire_drake', name: '🐲 Rồng Lửa Nhí', rarity: 'Epic', buffs: { atk: 30, crit: 0.05 }, desc: 'Phun lửa phụ bạn trong lúc chiến đấu.' },
        shadow_beast: { code: 4018, id: 'shadow_beast', name: '🌑 Thú Bóng Ma', rarity: 'Epic', buffs: { atk: 25, crit: 0.08 }, desc: 'Hiện diện rồi biến mất trong chớp mắt.' },
        crystal_butterfly: { code: 4019, id: 'crystal_butterfly', name: '🦋 Bướm Tinh Thể', rarity: 'Epic', buffs: { hp: 200, def: 30 }, desc: 'Vảy cánh phản chiếu ma pháp bảo vệ.' },

        // Legendary
        void_wisp: { code: 4020, id: 'void_wisp', name: '✨ Tinh Linh Hư Không', rarity: 'Legendary', buffs: { atk: 50, def: 50, crit: 0.1 }, desc: 'Ánh sáng ma mị hút cạn sinh lực kẻ thù.' },
        phoenix_chick: { code: 4021, id: 'phoenix_chick', name: '🔥 Phượng Hoàng Non', rarity: 'Legendary', buffs: { atk: 40, hp: 100 }, desc: 'Hơi ấm vĩnh cửu bao bọc chủ nhân.' },
        ancient_dragon: { code: 4022, id: 'ancient_dragon', name: '🐉 Long Thần Cổ Đại', rarity: 'Legendary', buffs: { atk: 100, hp: 200, crit: 0.05 }, desc: 'Vị vua của bầu trời từ thuở khai thiên.' },

        // Divine
        cosmic_serpent: { code: 4023, id: 'cosmic_serpent', name: '🌌 Mãng Xà Vũ Trụ', rarity: 'Divine', buffs: { atk: 200, def: 200, hp: 1000, crit: 0.15 }, desc: 'Cuộn mình quanh các thiên hà, nắm giữ sức mạnh tối thượng.' },
        light_bringer: { code: 4024, id: 'light_bringer', name: '✨ Sứ Giả Ánh Sáng', rarity: 'Divine', buffs: { atk: 150, agi: 100, hp: 2000, crit: 0.20 }, desc: 'Xua tan mọi bóng tối, ban phước lành vĩnh cửu.' }
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
