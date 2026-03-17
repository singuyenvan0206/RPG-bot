module.exports = {
    weapons: {
        // --- COMMON (Universal or Level 1-10) ---
        sharp_stick: { code: 101, id: 'sharp_stick', name: '🥢 Gậy Nhọn', type: 'weapon', rarity: 'Common', atk: 4, crit: 0.02, desc: 'Vũ khí thô sơ nhất.' },
        rusted_sword: { code: 1, id: 'rusted_sword', name: '⚔️ Kiếm Rỉ Sét', type: 'weapon', rarity: 'Common', atk: 7, crit: 0.01, requiredClass: ['Warrior', 'Assassin'], desc: 'Một thanh kiếm cũ kỹ, mẻ nhiều chỗ.' },
        iron_dagger: { code: 2, id: 'iron_dagger', name: '🗡️ Dao Găm Sắt', type: 'weapon', rarity: 'Common', atk: 8, crit: 0.05, requiredClass: ['Assassin'], desc: 'Nhỏ gọn và sắc bén cơ bản.' },
        wooden_bow: { code: 11, id: 'wooden_bow', name: '🏹 Cung Gỗ', type: 'weapon', rarity: 'Common', atk: 7, crit: 0.08, requiredClass: ['Ranger'], desc: 'Cung săn bắn cơ bản.' },
        apprentice_wand: { code: 112, id: 'apprentice_wand', name: '🪄 Đũa Tập Sự', type: 'weapon', rarity: 'Common', atk: 6, crit: 0.03, requiredClass: ['Mage'], desc: 'Dành cho những pháp sư mới học việc.' },
        stone_hammer: { code: 102, id: 'stone_hammer', name: '🔨 Búa Đá', type: 'weapon', rarity: 'Common', atk: 12, crit: 0.01, requiredClass: ['Warrior'], desc: 'Nặng nề nhưng khá đau.' },

        // --- RARE (Level 11-25) ---
        warrior_blade: { code: 3, id: 'warrior_blade', name: '🔪 Đao Chiến Binh', type: 'weapon', rarity: 'Rare', atk: 22, crit: 0.02, requiredClass: ['Warrior'], desc: 'Vũ khí tiêu chuẩn của lính gác.' },
        fire_staff: { code: 5, id: 'fire_staff', name: '🔥 Quyền Trượng Lửa', type: 'weapon', rarity: 'Rare', atk: 25, crit: 0.05, element: 'Fire', requiredClass: ['Mage'], desc: 'Viên đá đỏ trên đỉnh tỏa nhiệt dữ dội.' },
        hunters_bow: { code: 103, id: 'hunters_bow', name: '🏹 Cung Thợ Săn', type: 'weapon', rarity: 'Rare', atk: 24, crit: 0.12, requiredClass: ['Ranger'], desc: 'Tầm bắn xa và ổn định.' },
        poison_dagger: { code: 14, id: 'poison_dagger', name: '☣️ Dao Găm Độc', type: 'weapon', rarity: 'Rare', atk: 18, crit: 0.10, requiredClass: ['Assassin'], desc: 'Lưỡi dao tẩm kịch độc màu tím.' },
        steel_axe: { code: 12, id: 'steel_axe', name: '🪓 Rìu Thép', type: 'weapon', rarity: 'Rare', atk: 30, crit: 0.03, requiredClass: ['Warrior'], desc: 'Nặng nề nhưng cú bổ cực mạnh.' },
        ice_wand: { code: 104, id: 'ice_wand', name: '🧊 Đũa Phép Băng', type: 'weapon', rarity: 'Rare', atk: 24, crit: 0.04, element: 'Water', requiredClass: ['Mage'], desc: 'Lạnh lẽo thấu xương.' },
        earth_mace: { code: 105, id: 'earth_mace', name: '⛰️ Chùy Đất', type: 'weapon', rarity: 'Rare', atk: 32, crit: 0.02, element: 'Earth', requiredClass: ['Warrior'], desc: 'Nặng như ngàn cân treo sợi bún.' },
        dual_sabers: { code: 113, id: 'dual_sabers', name: '⚔️ Song Kiếm Chớp Nhoáng', type: 'weapon', rarity: 'Rare', atk: 20, agi: 15, requiredClass: ['Assassin', 'Ranger'], desc: 'Sự kết hợp hoàn hảo giữa tốc độ và lực chém.' },

        // --- EPIC (Level 26-60) ---
        shadow_blade: { code: 4, id: 'shadow_blade', name: '🌑 Lưỡi Dao Bóng Đêm', type: 'weapon', rarity: 'Epic', atk: 65, crit: 0.15, element: 'Void', requiredClass: ['Assassin'], desc: 'Phát ra một luồng sát khí lạnh lẽo.' },
        silver_katana: { code: 13, id: 'silver_katana', name: '⚔️ Katana Bạc', type: 'weapon', rarity: 'Epic', atk: 55, crit: 0.18, requiredClass: ['Assassin', 'Warrior'], desc: 'Sắc bén vô cùng, chém sắt như chém bùn.' },
        holy_mace: { code: 15, id: 'holy_mace', name: '🔨 Chùy Thánh', type: 'weapon', rarity: 'Epic', atk: 48, crit: 0.05, element: 'Light', requiredClass: ['Warrior'], desc: 'Tỏa ra ánh sáng xua tan bóng tối.' },
        wind_shuriken: { code: 17, id: 'wind_shuriken', name: '🌀 Phi Tiêu Phong Thần', type: 'weapon', rarity: 'Epic', atk: 42, crit: 0.30, element: 'Wind', requiredClass: ['Ranger', 'Assassin'], desc: 'Xé toạc không gian khi bay.' },
        inferno_greatsword: { code: 106, id: 'inferno_greatsword', name: '🔥 Đại Đao Hỏa Ngục', type: 'weapon', rarity: 'Epic', atk: 85, crit: 0.08, element: 'Fire', requiredClass: ['Warrior'], desc: 'Cháy rực rỡ dưới ánh trời tà.' },
        thunder_bolt_bow: { code: 107, id: 'thunder_bolt_bow', name: '⚡ Cung Thiên Lôi', type: 'weapon', rarity: 'Epic', atk: 75, crit: 0.20, element: 'Wind', requiredClass: ['Ranger'], desc: 'Mỗi mũi tên mang theo sức mạnh của sấm sét.' },
        oracle_staff: { code: 114, id: 'oracle_staff', name: '🔮 Trượng Tiên Tri', type: 'weapon', rarity: 'Epic', atk: 70, mana: 100, element: 'Light', requiredClass: ['Mage'], desc: 'Nhìn thấu tương lai để điều khiển ma pháp.' },

        // --- LEGENDARY (Level 61-100) ---
        dragon_slayer: { code: 16, id: 'dragon_slayer', name: '🐉 Long Đao', type: 'weapon', rarity: 'Legendary', atk: 150, crit: 0.22, requiredClass: ['Warrior'], desc: 'Thanh đao truyền thuyết dùng để hạ gục rồng.' },
        void_reaper_scythe: { code: 108, id: 'void_reaper_scythe', name: '☄️ Lưỡi Hái Tử Thần', type: 'weapon', rarity: 'Legendary', atk: 180, crit: 0.28, element: 'Void', requiredClass: ['Assassin', 'Mage'], desc: 'Gặt hái linh hồn từ vực thẳm.' },
        excalibur_fragment: { code: 109, id: 'excalibur_fragment', name: '🗡️ Mảnh Vỡ Excalibur', type: 'weapon', rarity: 'Legendary', atk: 160, crit: 0.18, element: 'Light', requiredClass: ['Warrior'], desc: 'Dù chỉ là một mảnh, nó vẫn mang hào quang chính trực.' },
        phoenix_wing_bow: { code: 115, id: 'phoenix_wing_bow', name: '🦅 Cung Cánh Phượng', type: 'weapon', rarity: 'Legendary', atk: 140, agi: 50, element: 'Fire', requiredClass: ['Ranger'], desc: 'Tốc độ như cánh chim phượng hoàng.' },
        abyssal_codex: { code: 116, id: 'abyssal_codex', name: '📖 Cổ Thư Vực Thẳm', type: 'weapon', rarity: 'Legendary', atk: 130, mana: 300, element: 'Void', requiredClass: ['Mage'], desc: 'Ghi chép những cấm thuật đáng sợ.' },

        // --- MYTHIC (Endgame) ---
        god_slayer_blade: { code: 110, id: 'god_slayer_blade', name: '🌌 Thanh Gươm Diệt Thần', type: 'weapon', rarity: 'Mythic', atk: 450, crit: 0.40, element: 'Void', requiredClass: ['Warrior', 'Assassin'], desc: 'Đã từng nhuốm máu của các vị thần.' },
        eternity_staff: { code: 111, id: 'eternity_staff', name: '✨ Trượng Vĩnh Hằng', type: 'weapon', rarity: 'Mythic', atk: 350, crit: 0.25, element: 'Light', requiredClass: ['Mage'], desc: 'Nguồn năng lượng vô tận của vũ trụ.' },
        starlight_longbow: { code: 117, id: 'starlight_longbow', name: '🏹 Trường Cung Tinh Tú', type: 'weapon', rarity: 'Mythic', atk: 400, crit: 0.35, element: 'Light', requiredClass: ['Ranger'], desc: 'Bắn ra những tia sáng tinh tú xuyên mọi vật cản.' }
    },
    armors: {
        // Common
        leather_tunic: { code: 6, id: 'leather_tunic', name: '👕 Áo Da', type: 'armor', rarity: 'Common', def: 5, hp: 15, desc: 'Áo giáp nhẹ từ da thú.' },
        silk_robe: { code: 18, id: 'silk_robe', name: '👘 Áo Choàng Lụa', type: 'armor', rarity: 'Common', def: 2, hp: 10, mana: 20, desc: 'Nhẹ nhàng và hỗ trợ hồi năng lượng.' },
        cloth_armor: { code: 201, id: 'cloth_armor', name: '👕 Giáp Vải', type: 'armor', rarity: 'Common', def: 3, hp: 8, desc: 'Chỉ tốt hơn trần trụi một chút.' },

        // Rare
        iron_chestplate: { code: 7, id: 'iron_chestplate', name: '🛡️ Giáp Lưng Sắt', type: 'armor', rarity: 'Rare', def: 20, hp: 50, desc: 'Chống chịu tốt trước các đòn chém.' },
        elven_cloak: { code: 20, id: 'elven_cloak', name: '🍃 Choàng Tiên Tộc', type: 'armor', rarity: 'Rare', def: 12, hp: 40, agi: 15, desc: 'Dệt từ tơ tiên, cực kỳ bền và nhẹ.' },
        bronze_armor: { code: 202, id: 'bronze_armor', name: '🛡️ Giáp Đồng', type: 'armor', rarity: 'Rare', def: 25, hp: 70, desc: 'Chắc chắn và đáng tin cậy.' },
        fire_shield_plate: { code: 203, id: 'fire_shield_plate', name: '🔥 Giáp Kháng Lửa', type: 'armor', rarity: 'Rare', def: 18, hp: 100, element: 'Fire', desc: 'Giúp bạn đi xuyên qua dung nham.' },

        // Epic
        void_mantle: { code: 8, id: 'void_mantle', name: '🌌 Áo Choàng Hư Không', type: 'armor', rarity: 'Epic', def: 45, hp: 150, element: 'Void', desc: 'Hấp thụ một phần sát thương vào cõi hư vô.' },
        heavy_plate: { code: 19, id: 'heavy_plate', name: '🏢 Đại Giáp Thép', type: 'armor', rarity: 'Epic', def: 60, hp: 250, desc: 'Bộ giáp nặng nề biến bạn thành pháo đài di động.' },
        crystal_armor: { code: 204, id: 'crystal_armor', name: '💎 Giáp Tinh Thể', type: 'armor', rarity: 'Epic', def: 50, hp: 300, desc: 'Lấp lánh và cực kỳ cứng cáp.' },
        thunder_cloak: { code: 205, id: 'thunder_cloak', name: '⚡ Choàng Sấm Sét', type: 'armor', rarity: 'Epic', def: 35, hp: 200, agi: 30, element: 'Wind', desc: 'Cảm giác như gió luôn thổi sau lưng.' },

        // Legendary
        dragon_scale_armor: { code: 21, id: 'dragon_scale_armor', name: '🐲 Giáp Vảy Rồng', type: 'armor', rarity: 'Legendary', def: 100, hp: 600, desc: 'Lớp bảo vệ tuyệt đối từ vảy của rồng thượng cổ.' },
        valkyrie_mail: { code: 206, id: 'valkyrie_mail', name: '🕊️ Giáp Valkyrie', type: 'armor', rarity: 'Legendary', def: 85, hp: 800, element: 'Light', desc: 'Vẻ đẹp của sự hy sinh và sức mạnh.' },

        // Mythic
        abyssal_juggernaut: { code: 207, id: 'abyssal_juggernaut', name: '🌑 Giáp Vực Thẳm', type: 'armor', rarity: 'Mythic', def: 250, hp: 2000, element: 'Void', desc: 'Vết nứt không gian bảo vệ người mặc.' },
        celestial_plate: { code: 208, id: 'celestial_plate', name: '✨ Giáp Thiên Hà', type: 'armor', rarity: 'Mythic', def: 180, hp: 3000, element: 'Light', desc: 'Sức mạnh của những vì sao bao bọc bạn.' }
    },
    accessories: {
        // Common
        wolf_tooth: { code: 9, id: 'wolf_tooth', name: '🦴 Dây Chuyền Nanh Sói', type: 'accessory', rarity: 'Common', atk: 5, agi: 10, desc: 'Mang lại sự nhanh nhẹn của loài sói.' },
        lucky_charm: { code: 301, id: 'lucky_charm', name: '🍀 Bùa May Mắn', type: 'accessory', rarity: 'Common', crit: 0.02, desc: 'Cỏ 4 lá giúp bạn may mắn hơn.' },

        // Rare
        emerald_earring: { code: 22, id: 'emerald_earring', name: '👂 Bông Tai Lục Bảo', type: 'accessory', rarity: 'Rare', mana: 50, def: 5, desc: 'Tăng cường sự tập trung và phòng ngự.' },
        wind_boots: { code: 302, id: 'wind_boots', name: '👟 Giày Gió', type: 'accessory', rarity: 'Rare', agi: 25, desc: 'Tăng tốc độ di chuyển.' },

        // Epic
        ruby_ring: { code: 10, id: 'ruby_ring', name: '💍 Nhẫn Hồng Ngọc', type: 'accessory', rarity: 'Epic', hp: 80, crit: 0.05, element: 'Fire', desc: 'Khảm viên ngọc quý rực sáng huy hoàng.' },
        berserker_pendant: { code: 23, id: 'berserker_pendant', name: '🩸 Mặt Dây Cuồng Chiến', type: 'accessory', rarity: 'Epic', atk: 25, crit: 0.08, desc: 'Kích thích bản năng chiến đấu mãnh liệt.' },
        spirit_gem: { code: 303, id: 'spirit_gem', name: '💎 Ngọc Linh Hồn', type: 'accessory', rarity: 'Epic', mana: 200, atk: 15, desc: 'Tăng cường ma lực bản thân.' },

        // Legendary
        ancient_relic: { code: 24, id: 'ancient_relic', name: '🏺 Cổ Vật Bí Ẩn', type: 'accessory', rarity: 'Legendary', atk: 50, def: 50, hp: 200, desc: 'Chứa đựng sức mạnh của các vị thần cổ đại.' },
        phoenix_feather: { code: 304, id: 'phoenix_feather', name: '🪶 Lông Vũ Phượng Hoàng', type: 'accessory', rarity: 'Legendary', hp: 500, element: 'Fire', desc: 'Tái sinh từ đống tro tàn.' },

        // Mythic
        eye_of_the_void: { code: 305, id: 'eye_of_the_void', name: '👁️ Nhãn Thần Hư Không', type: 'accessory', rarity: 'Mythic', atk: 100, crit: 0.15, element: 'Void', desc: 'Nhìn thấu mọi kẽ hở của thế giới.' },
        crown_of_gods: { code: 306, id: 'crown_of_gods', name: '👑 Vương Miện Tối Cao', type: 'accessory', rarity: 'Mythic', def: 100, hp: 1500, element: 'Light', desc: 'Quyền năng định đoạt số phận.' }
    }
};

module.exports.getAllItems = function() {
    return { ...this.weapons, ...this.armors, ...this.accessories };
};

module.exports.getItem = function(itemId) {
    if (!itemId) return null;
    const all = this.getAllItems();
    if (all[itemId]) return all[itemId];
    
    // Fallback to numeric code search
    for (const key in all) {
        if (all[key].code == itemId) {
            return all[key];
        }
    }
    
    return null;
};
