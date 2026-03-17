module.exports = {
    materials: {
        // Base Metals
        iron_ore: { code: 3001, id: 'iron_ore', name: '⛓️ Quặng Sắt', rarity: 'Common', desc: 'Nguyên liệu cơ bản để rèn đồ.' },
        bronze_scrap: { code: 3008, id: 'bronze_scrap', name: '🧱 Mảnh Đồng Vụn', rarity: 'Common', desc: 'Có thể nấu chảy để rèn trang bị đồng.' },
        steel_ingot: { code: 3009, id: 'steel_ingot', name: '🌑 Thỏi Thép', rarity: 'Rare', desc: 'Thép tôi luyện kỹ càng, rất cứng.' },

        // Magic Components
        magic_core: { code: 3002, id: 'magic_core', name: '🔮 Lõi Phép Thuật', rarity: 'Rare', desc: 'Chứa đựng ma lực nguyên thủy, dùng để cường hóa.' },
        void_shard: { code: 3003, id: 'void_shard', name: '☄️ Mảnh Vỡ Hư Không', rarity: 'Epic', desc: 'Vật liệu tà ác, chỉ rớt từ World Boss hoặc quái vật mạnh.' },
        light_essence: { code: 3010, id: 'light_essence', name: '✨ Tinh Hoa Ánh Sáng', rarity: 'Epic', desc: 'Ánh sáng thuần khiết kết tinh.' },
        
        // Gems
        ruby: { code: 3004, id: 'ruby', name: '💎 Hồng Ngọc', rarity: 'Rare', desc: 'Viên đá đỏ thẫm rực cháy sức mạnh hỏa hệ.' },
        emerald: { code: 3005, id: 'emerald', name: '💚 Lục Bảo', rarity: 'Rare', desc: 'Tinh hoa thảo mộc kết tinh thành đá quý.' },
        sapphire: { code: 3006, id: 'sapphire', name: '💙 Lam Ngọc', rarity: 'Rare', desc: 'Viên đá biển sâu mang theo hơi lạnh vĩnh cửu.' },
        diamond: { code: 3007, id: 'diamond', name: '💍 Kim Cương', rarity: 'Epic', desc: 'Vật chất cứng nhất thế giới, cực kỳ quý hiếm.' },
        amethyst: { code: 3011, id: 'amethyst', name: '🟣 Thạch Anh Tím', rarity: 'Rare', desc: 'Đá quý mang năng lượng huyền bí.' },
        topaz: { code: 3012, id: 'topaz', name: '🟡 Hoàng Ngọc', rarity: 'Rare', desc: 'Tỏa ra sự ấm áp của đất mẹ.' },

        // Nature & Wood
        oak_wood: { code: 3101, id: 'oak_wood', name: '🪵 Gỗ Sồi', rarity: 'Common', desc: 'Loại gỗ bền chắc cho các công cụ cơ bản.' },
        elven_wood: { code: 3102, id: 'elven_wood', name: '🍃 Gỗ Tinh Linh', rarity: 'Rare', desc: 'Gỗ từ những cây cổ thụ có linh tính.' },
        darkwood: { code: 3103, id: 'darkwood', name: '🌑 Gỗ Mun', rarity: 'Rare', desc: 'Loại gỗ đen tuyền, thường dùng chế tạo quyền trượng.' },
        spirit_bark: { code: 3104, id: 'spirit_bark', name: '🍂 Vỏ Cây Linh Hồn', rarity: 'Epic', desc: 'Lớp vỏ bảo vệ của những đại thụ nghìn năm.' },

        // Herbs & Ingredients
        medicinal_herb: { code: 4101, id: 'medicinal_herb', name: '🌿 Thảo Dược', rarity: 'Common', desc: 'Dùng để chế tạo thuốc hồi phục cơ bản.' },
        mana_blossom: { code: 4102, id: 'mana_blossom', name: '🌸 Hoa Ma Thuật', rarity: 'Rare', desc: 'Loài hoa tỏa ra ánh sáng xanh huyền bí.' },
        life_root: { code: 4103, id: 'life_root', name: '🪵 Rễ Cây Sự Sống', rarity: 'Epic', desc: 'Chứa đựng sinh mệnh lực mạnh mẽ.' },
        fire_petal: { code: 4104, id: 'fire_petal', name: '🔥 Cánh Hoa Lửa', rarity: 'Rare', desc: 'Cực nóng, có thể gây bỏng khi chạm vào.' },

        // Fish
        carp: { code: 4001, id: 'carp', name: '🐟 Cá Chép', rarity: 'Common', desc: 'Một loại cá phổ biến, có thể bán lấy vàng.' },
        salmon: { code: 4002, id: 'salmon', name: '🍣 Cá Hồi', rarity: 'Rare', desc: 'Loại cá ngon và có giá trị cao hơn.' },
        golden_fish: { code: 4003, id: 'golden_fish', name: '✨ Cá Vàng May Mắn', rarity: 'Epic', desc: 'Một huyền thoại trong giới ngư phủ, mang lại rất nhiều vàng.' },
        abyssal_eel: { code: 4004, id: 'abyssal_eel', name: '🐍 Lươn Vực Thẳm', rarity: 'Rare', desc: 'Chỉ sống ở nơi tối tăm nhất đại dương.' },

        // Monster Parts
        slime_essence: { code: 5001, id: 'slime_essence', name: '💧 Tinh chất Slime', rarity: 'Common', desc: 'Chất nhầy dính rớt ra từ Slime.' },
        goblin_tooth: { code: 5002, id: 'goblin_tooth', name: '🦴 Răng Yêu Tinh', rarity: 'Common', desc: 'Chứng tích sau cuộc đi săn Yêu Tinh.' },
        wolf_pelt: { code: 5003, id: 'wolf_pelt', name: '🐺 Da Sói', rarity: 'Common', desc: 'Bộ lông dày và ấm áp của sói rừng.' },
        dragon_scale: { code: 5004, id: 'dragon_scale', name: '🐲 Vảy Rồng', rarity: 'Legendary', desc: 'Mảnh vảy cứng cáp của loài sinh vật đứng đầu chuỗi thức ăn.' },
        ancient_bone: { code: 5005, id: 'ancient_bone', name: '🦴 Xương Cổ Đại', rarity: 'Rare', desc: 'Mẩu xương hóa thạch từ hàng ngàn năm trước.' },
        yeti_fur: { code: 5006, id: 'yeti_fur', name: '🧤 Lông Thú Yeti', rarity: 'Rare', desc: 'Bộ lông cực kỳ ấm, chịu được cái lạnh thấu xương.' },
        demon_horn: { code: 5007, id: 'demon_horn', name: '😈 Sừng Quỷ', rarity: 'Epic', desc: 'Cứng và mang theo hơi thở của hỏa ngục.' },
        god_tear: { code: 5008, id: 'god_tear', name: '💧 Nước Mắt Thần Linh', rarity: 'Mythic', desc: 'Vật phẩm quý giá nhất thế gian, dùng cho vũ khí thần thoại.' }
    }
};

module.exports.getMaterial = function(matId) {
    if (this.materials[matId]) return this.materials[matId];
    // Numeric lookup
    for (const key in this.materials) {
        if (this.materials[key].code == matId) return this.materials[key];
    }
    return null;
};

module.exports.getAllMaterials = function() {
    return this.materials;
};
