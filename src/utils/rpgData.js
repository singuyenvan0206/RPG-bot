module.exports = {
    whispering_forest: {
        name: '🌳 Khu Rừng Thì Thầm',
        monsters: [
            { code: 1001, id: 'slime_leaf', name: '🟢 Slime Lá Mục', level: 1, rarity: 'Common', element: 'Wood', hp: 40, atk: 8, gold: 15, exp: 25, image: 'slime_leaf.png' },
            { code: 1002, id: 'goblin_scout', name: '👺 Yêu Tinh Trinh Sát', level: 5, rarity: 'Common', element: 'Earth', hp: 70, atk: 15, gold: 30, exp: 45, image: 'goblin_scout.png' },
            { code: 1003, id: 'wolf_shadow', name: '🐺 Sói Bóng Đêm', level: 7, rarity: 'Common', element: 'Void', hp: 100, atk: 24, gold: 50, exp: 70, image: 'wolf_shadow.png' },
            { code: 1004, id: 'forest_treant', name: '🌳 Người Cây Già', level: 10, rarity: 'Rare', element: 'Wood', hp: 160, atk: 18, gold: 60, exp: 90, image: 'forest_treant.png' },
            { code: 1005, id: 'giant_spider', name: '🕷️ Nhện Rừng Khổng Lồ', level: 3, rarity: 'Common', element: 'Earth', hp: 75, atk: 25, gold: 55, exp: 75, image: 'giant_spider.png' },
            { code: 1006, id: 'poison_mushroom', name: '🍄 Nấm Độc Lang Thang', level: 2, rarity: 'Common', element: 'Wood', hp: 50, atk: 12, gold: 18, exp: 30, image: 'poison_mushroom.png' },
            { code: 1007, id: 'forest_nymph', name: '🧚 Tiên Rừng Hắc Ám', level: 8, rarity: 'Rare', element: 'Wood', hp: 130, atk: 30, gold: 80, exp: 130, image: 'forest_nymph.png' },
            { code: 1008, id: 'ancient_owlbear', name: '🦉 Gấu Cú Cổ Đại', level: 12, rarity: 'Elite', element: 'Earth', hp: 500, atk: 60, gold: 400, exp: 700, image: 'ancient_owlbear.png' },
            { code: 1009, id: 'forest_bat', name: '🦇 Dơi Rừng Trinh Sát', level: 4, rarity: 'Common', element: 'Wind', hp: 60, atk: 18, gold: 25, exp: 40, image: 'forest_bat.png' },
            { code: 1010, id: 'rogue_ghost_r', name: '👻 Hồn Ma Nhà Thám Hiểm', level: 6, rarity: 'Common', element: 'Void', hp: 85, atk: 28, gold: 45, exp: 60, image: 'rogue_ghost_r.png' },
            { code: 1011, id: 'wild_boar_r', name: '🐗 Heo Rừng Hung Tợn', level: 9, rarity: 'Rare', element: 'Earth', hp: 220, atk: 35, gold: 110, exp: 160, image: 'wild_boar_r.png' },
            { code: 1012, id: 'enchanted_owl_r', name: '🦉 Cú Phép Thuật', level: 11, rarity: 'Rare', element: 'Wind', hp: 140, atk: 48, gold: 130, exp: 210, image: 'enchanted_owl_r.png' },
            { code: 1013, id: 'black_widow_r', name: '🕷️ Nhện Góa Phụ Đen', level: 13, rarity: 'Elite', element: 'Void', hp: 450, atk: 80, gold: 450, exp: 800, image: 'black_widow_r.png' },
            { code: 1014, id: 'dragonling_r', name: '🐲 Long Nhi Lục Bảo', level: 15, rarity: 'Elite', element: 'Wood', hp: 650, atk: 100, gold: 650, exp: 1100, image: 'dragonling_r.png' },
            { code: 1015, id: 'forest_cat', name: '🐈 Mèo Rừng Lang Thang', level: 2, rarity: 'Common', element: 'Wind', hp: 45, atk: 15, gold: 20, exp: 35, image: 'forest_cat.png' }
        ],
        events: [
            { code: 1101, id: 'fairy_spring', text: 'Bạn tìm thấy một Suối Tiên. Vết thương được chữa lành hoàn toàn!', heal: 1000 },
            { code: 1102, id: 'lost_merchant', text: 'Một thương nhân đi lạc đánh rơi túi tiền vàng.', gold: 100 },
            { code: 1103, id: 'beehive', text: 'Bạn vô tình chọc phải tổ ong rừng! Đau quá!', damage: 20 },
            { code: 1104, id: 'ancient_shrine', text: 'Bạn tìm thấy một bệ thờ cổ xưa tỏa ra ánh sáng xanh.', exp: 50 },
            { code: 1105, id: 'lucky_clover', text: 'Bạn tìm thấy một cỏ 4 lá may mắn trên thảm cỏ.', gold: 50 },
            { code: 1106, id: 'poison_ivy', text: 'Bạn vô tình chạm vào lá độc, da dẻ ngứa ngáy khó chịu.', damage: 15 },
            { code: 1107, id: 'hermit_hut', text: 'Vị ẩn sĩ trong rừng mời bạn một chén trà thảo mộc.', heal: 100 },
            { code: 1108, id: 'buried_acorn', text: 'Bạn đào được một quả sồi thần kỳ chôn dưới gốc cây.', exp: 30 }
        ]
    },
    burning_desert: {
        name: '🏜️ Sa Mạc Rực Lửa',
        monsters: [
            { code: 2001, id: 'fire_imp_d', name: '🔥 Tiểu Quỷ Lửa', level: 20, rarity: 'Common', element: 'Fire', hp: 250, atk: 100, gold: 150, exp: 250, image: 'fire_imp_d.png' },
            { code: 2002, id: 'desert_scorp_d', name: '🦂 Bò Cạp Cát', level: 22, rarity: 'Common', element: 'Earth', hp: 300, atk: 90, gold: 180, exp: 300, image: 'desert_scorp_d.png' },
            { code: 2003, id: 'mummy_soldier_d', name: '🧟 Chiến Binh Xác Ướp', level: 25, rarity: 'Common', element: 'Void', hp: 450, atk: 130, gold: 250, exp: 450, image: 'mummy_soldier_d.png' },
            { code: 2004, id: 'sand_serpent_d', name: '🐍 Rắn Cát Khổng Lồ', level: 28, rarity: 'Rare', element: 'Earth', hp: 800, atk: 180, gold: 500, exp: 900, image: 'sand_serpent_d.png' },
            { code: 2005, id: 'sphinx_guard_d', name: '🦁 Nhân Sư Thủ Vệ', level: 35, rarity: 'Elite', element: 'Light', hp: 3000, atk: 500, gold: 2000, exp: 5000, image: 'sphinx_guard_d.png' },
            { code: 2006, id: 'sand_wraith', name: '👻 Bóng Ma Cát Bụi', level: 40, rarity: 'Rare', element: 'Void', hp: 1200, atk: 800, gold: 1500, exp: 4000, image: 'sand_wraith.png' },
            { code: 2007, id: 'cacti_bruiser', name: '🌵 Xương Rồng Đô Vật', level: 23, rarity: 'Common', element: 'Wood', hp: 350, atk: 95, gold: 120, exp: 200, image: 'cacti_bruiser.png' },
            { code: 2008, id: 'fire_elemental_d', name: '🔥 Hỏa Nguyên Tố', level: 32, rarity: 'Rare', element: 'Fire', hp: 700, atk: 450, gold: 1200, exp: 3500, image: 'fire_elemental_d.png' },
            { code: 2009, id: 'sand_spirit', name: '✨ Linh Hồn Sa Mạc', level: 38, rarity: 'Rare', element: 'Light', hp: 1500, atk: 700, gold: 3000, exp: 8000, image: 'sand_spirit.png' },
            { code: 2010, id: 'desert_dragon', name: '🐲 Rồng Sa Mạc', level: 60, rarity: 'Elite', element: 'Fire', hp: 15000, atk: 3500, gold: 30000, exp: 80000, image: 'desert_dragon.png' },
            { code: 2011, id: 'anubis_seeker', name: '⚖️ Kẻ Tầm Đạo Anubis', level: 50, rarity: 'Elite', element: 'Void', hp: 8000, atk: 2500, gold: 15000, exp: 45000, image: 'anubis_seeker.png' },
            { code: 2012, id: 'dust_devil_d', name: '🌪️ Quỷ Cát Bụi', level: 21, rarity: 'Common', element: 'Wind', hp: 220, atk: 110, gold: 100, exp: 180, image: 'dust_devil_d.png' },
            { code: 2013, id: 'mirage_mage', name: '🔮 Pháp Sư Ảo Ảnh', level: 36, rarity: 'Rare', element: 'Void', hp: 900, atk: 900, gold: 2000, exp: 6000, image: 'mirage_mage.png' },
            { code: 2014, id: 'sand_stalker', name: '🦂 Kẻ Săn Mồi Trong Cát', level: 27, rarity: 'Common', element: 'Earth', hp: 500, atk: 200, gold: 300, exp: 500, image: 'sand_stalker.png' },
            { code: 2015, id: 'camel_mimic', name: '🐫 Lạc Đà Giả Mạo', level: 24, rarity: 'Common', element: 'Earth', hp: 400, atk: 80, gold: 200, exp: 350, image: 'camel_mimic.png' }
        ],
        events: [
            { code: 1111, id: 'mirage', text: 'Bạn bị lạc trong Ảo Ảnh và mất một lượng máu.', damage: 50 },
            { code: 1112, id: 'oasis', text: 'Tuyệt vời! Bạn tìm thấy một Ốc Đảo giải nhiệt và hồi phục HP.', heal: 300 },
            { code: 1113, id: 'sandstorm', text: 'Cơn bão cát bất ngờ quét qua, trang bị bị bào mòn một chút.', damage: 80 },
            { code: 1114, id: 'scorp_den', text: 'Bạn vô tình dẫm vào tổ bọ cạp cát.', damage: 100 },
            { code: 1115, id: 'dust_chest', text: 'Một chiếc rương cũ phủ đầy cát bụi chứa đầy vàng.', gold: 300 },
            { code: 1116, id: 'sphinx_riddle', text: 'Bạn giải được câu đố của một linh hồn nhân sư.', exp: 200 },
            { code: 1117, id: 'sun_blessing', text: 'Ánh nắng rực rỡ tiếp thêm sức mạnh cho bạn.', heal: 150 },
            { code: 1118, id: 'ancient_map', text: 'Bạn tìm thấy một mảnh bản đồ cũ chỉ đường.', exp: 150 }
        ]
    },
    frozen_mountains: {
        name: '❄️ Dãy Núi Băng Giá',
        monsters: [
            { code: 3001, id: 'ice_slime_f', name: '🧊 Slime Băng', level: 50, rarity: 'Common', element: 'Water', hp: 1200, atk: 350, gold: 500, exp: 1200, image: 'ice_slime_f.png' },
            { code: 3002, id: 'yeti_scout', name: '🦍 Yeti Trinh Sát', level: 60, rarity: 'Common', element: 'Earth', hp: 2000, atk: 500, gold: 800, exp: 2000, image: 'yeti_scout.png' },
            { code: 3003, id: 'frost_wolf_f', name: '🐺 Sói Tuyết Ngàn Năm', level: 55, rarity: 'Common', element: 'Water', hp: 1500, atk: 450, gold: 650, exp: 1800, image: 'frost_wolf_f.png' },
            { code: 3004, id: 'ice_wraith_f', name: '👻 Linh Hồn Băng Giá', level: 65, rarity: 'Rare', element: 'Void', hp: 2500, atk: 900, gold: 2000, exp: 5000, image: 'ice_wraith_f.png' },
            { code: 3005, id: 'king_yeti_f', name: '🦍 Vua Tuyết Yeti', level: 85, rarity: 'Elite', element: 'Earth', hp: 10000, atk: 2500, gold: 15000, exp: 45000, image: 'king_yeti_f.png' },
            { code: 3006, id: 'ice_dragon_f', name: '🐲 Rồng Băng Gầm Thét', level: 120, rarity: 'Elite', element: 'Water', hp: 40000, atk: 8000, gold: 80000, exp: 250000, image: 'ice_dragon_f.png' },
            { code: 3007, id: 'snow_leopard_f', name: '🐆 Báo Tuyết Vĩnh Cửu', level: 58, rarity: 'Rare', element: 'Wind', hp: 1800, atk: 1200, gold: 1200, exp: 3500, image: 'snow_leopard_f.png' },
            { code: 3008, id: 'frozen_knight_f', name: '⚔️ Kỵ Sĩ Băng', level: 75, rarity: 'Rare', element: 'Void', hp: 5000, atk: 1800, gold: 5000, exp: 12000, image: 'frozen_knight_f.png' },
            { code: 3009, id: 'lich_shade_f', name: '💀 Bóng Ma Vua Lich', level: 140, rarity: 'Elite', element: 'Void', hp: 80000, atk: 12000, gold: 200000, exp: 700000, image: 'lich_shade_f.png' },
            { code: 3010, id: 'aurora_spirit_f', name: '✨ Linh Hồn Cực Quang', level: 70, rarity: 'Rare', element: 'Light', hp: 3500, atk: 1500, gold: 4000, exp: 10000, image: 'aurora_spirit_f.png' },
            { code: 3011, id: 'glacier_crab', name: '🦀 Cua Băng Hà', level: 52, rarity: 'Common', element: 'Earth', hp: 1600, atk: 400, gold: 300, exp: 600, image: 'glacier_crab.png' },
            { code: 3012, id: 'snow_owl', name: '🦉 Cú Tuyết Trắng', level: 54, rarity: 'Common', element: 'Wind', hp: 1100, atk: 600, gold: 450, exp: 900, image: 'snow_owl.png' },
            { code: 3013, id: 'ice_shards_f', name: '🧊 Mảnh Băng Bay', level: 51, rarity: 'Common', element: 'Water', hp: 900, atk: 700, gold: 400, exp: 800, image: 'ice_shards_f.png' },
            { code: 3014, id: 'frost_worm', name: '🐛 Sâu Băng Vĩ Đại', level: 68, rarity: 'Rare', element: 'Earth', hp: 4500, atk: 1400, gold: 3500, exp: 8500, image: 'frost_worm.png' },
            { code: 3015, id: 'mount_titan', name: '🏔️ Titan Đỉnh Tuyết', level: 160, rarity: 'Elite', element: 'Earth', hp: 150000, atk: 25000, gold: 500000, exp: 1500000, image: 'mount_titan.png' }
        ],
        events: [
            { code: 1121, id: 'avalanche', text: 'Một trận lở tuyết chôn vùi bạn! Bạn mất một lượng lớn HP.', damage: 150 },
            { code: 1122, id: 'frozen_chest', text: 'Bạn đập vỡ một tảng băng và phát hiện rương vàng.', gold: 400 },
            { code: 1123, id: 'hot_spring', text: 'Suối nước nóng giữa trời băng giá. Thật thoải mái!', heal: 500 },
            { code: 1124, id: 'ice_sculpture', text: 'Bức tượng băng tỏa ra luồng khí thần bí.', exp: 400 },
            { code: 1125, id: 'frost_bite', text: 'Không khí quá lạnh khiến bạn bị tê cóng.', damage: 100 },
            { code: 1126, id: 'yeti_snack', text: 'Bạn tìm thấy túi lương thực của một người leo núi quá cố.', heal: 400 },
            { code: 1127, id: 'silver_snowflake', text: 'Bạn nhặt được một bông tuyết bạc lấp lánh.', gold: 600 },
            { code: 1128, id: 'mountain_echo', text: 'Tiếng vang từ đỉnh núi dạy cho bạn một bài học kinh nghiệm.', exp: 500 }
        ]
    },
    abyss_ocean: {
        name: '🌊 Đại Dương Sâu Thẳm',
        monsters: [
            { code: 4001, id: 'deep_sea_angler_o', name: '🐟 Cá Lồng Đèn Quỷ', level: 80, rarity: 'Common', element: 'Void', hp: 3500, atk: 1200, gold: 1500, exp: 3000, image: 'deep_sea_angler_o.png' },
            { code: 4002, id: 'kraken_tentacle_o', name: '🦑 Xúc Tu Kraken', level: 90, rarity: 'Rare', element: 'Water', hp: 7000, atk: 2500, gold: 6000, exp: 15000, image: 'kraken_tentacle_o.png' },
            { code: 4003, id: 'sea_serpent_o', name: '🐍 Hải Xà Biển Sâu', level: 85, rarity: 'Common', element: 'Water', hp: 4500, atk: 1800, gold: 3000, exp: 6000, image: 'sea_serpent_o.png' },
            { code: 4004, id: 'leviathan_fragment_o', name: '🐲 Mảnh Thân Leviathan', level: 130, rarity: 'Elite', element: 'Water', hp: 35000, atk: 8000, gold: 50000, exp: 150000, image: 'leviathan_fragment_o.png' },
            { code: 4005, id: 'void_whale_o', name: '🐋 Cá Voi Hư Không', level: 160, rarity: 'Elite', element: 'Void', hp: 100000, atk: 20000, gold: 200000, exp: 500000, image: 'void_whale_o.png' },
            { code: 4006, id: 'siren_o', name: '🧜‍♀️ Tiên Cá Mê Hoặc', level: 88, rarity: 'Rare', element: 'Water', hp: 4000, atk: 2000, gold: 4500, exp: 10000, image: 'siren_o.png' },
            { code: 4007, id: 'abyssal_crab_o', name: '🦀 Cua Biển Sâu', level: 82, rarity: 'Common', element: 'Earth', hp: 5000, atk: 800, gold: 1200, exp: 2500, image: 'abyssal_crab_o.png' },
            { code: 4008, id: 'electric_eel_o', name: '🐍 Lươn Điện Ngầm', level: 95, rarity: 'Rare', element: 'Wind', hp: 3000, atk: 3500, gold: 6500, exp: 16000, image: 'electric_eel_o.png' },
            { code: 4009, id: 'drowned_pirate_o', name: '🏴‍☠️ Hải Tặc Chết Đuối', level: 84, rarity: 'Common', element: 'Void', hp: 4000, atk: 1500, gold: 2000, exp: 4500, image: 'drowned_pirate_o.png' },
            { code: 4010, id: 'triton_soldier', name: '🔱 Binh Sĩ Triton', level: 110, rarity: 'Rare', element: 'Water', hp: 12000, atk: 4500, gold: 15000, exp: 40000, image: 'triton_soldier.png' },
            { code: 4011, id: 'coral_beast', name: '🐚 Quái Thú San Hô', level: 81, rarity: 'Common', element: 'Earth', hp: 4800, atk: 1000, gold: 1100, exp: 2200, image: 'coral_beast.png' },
            { code: 4012, id: 'bubble_slime', name: '🧼 Slime Bong Bóng', level: 80, rarity: 'Common', element: 'Water', hp: 3200, atk: 900, gold: 1000, exp: 2000, image: 'bubble_slime.png' },
            { code: 4013, id: 'deep_shark', name: '🦈 Cá Mập Vực Thẳm', level: 120, rarity: 'Rare', element: 'Wind', hp: 18000, atk: 6000, gold: 25000, exp: 80000, image: 'deep_shark.png' },
            { code: 4014, id: 'ocean_spirit', name: '💧 Linh Hồn Đại Dương', level: 87, rarity: 'Common', element: 'Water', hp: 3800, atk: 1400, gold: 1800, exp: 4500, image: 'ocean_spirit.png' },
            { code: 4015, id: 'abyssal_god', name: '🔱 Thần Biển Sâu Poseidon', level: 250, rarity: 'Elite', element: 'Water', hp: 600000, atk: 80000, gold: 500000, exp: 3000000, image: 'abyssal_god.png' }
        ],
        events: [
            { code: 1131, id: 'whirlpool', text: 'Bị cuốn vào dòng xoáy ma thuật, bạn trôi dạt và bị thương.', damage: 200 },
            { code: 1132, id: 'pearl_clams', text: 'Bạn tìm thấy những con trai chứa ngọc quý!', gold: 800 },
            { code: 1133, id: 'mermaid_song', text: 'Tiếng hát mỹ nhân ngư hồi phục tinh thần cho bạn.', heal: 600 },
            { code: 1134, id: 'abyssal_rift', text: 'Một khe nứt dưới đáy biển tỏa ra năng lượng cổ xưa.', exp: 1000 },
            { code: 1135, id: 'jellyfish_sting', text: 'Bạn bị sứa điện châm trúng.', damage: 150 },
            { code: 1136, id: 'sunken_galleon', text: 'Bạn khám phá xác tàu đắm và tìm thấy vàng.', gold: 1200 },
            { code: 1137, id: 'coral_bloom', text: 'Rạn san hô nở hoa thần kỳ chữa lành vết thương.', heal: 700 },
            { code: 1138, id: 'poseidon_trial', text: 'Bạn vượt qua một thử thách nhỏ của biển cả.', exp: 1500 }
        ]
    },
    ancient_ruins: {
        name: '🏛️ Khu Di Tích Cổ',
        monsters: [
            { code: 5001, id: 'gargoyle_a', name: '👹 Quỷ Đá Gargoyle', level: 150, rarity: 'Common', element: 'Earth', hp: 20000, atk: 5000, gold: 5000, exp: 12000, image: 'gargoyle_a.png' },
            { code: 5002, id: 'cursed_knight_a', name: '⚔️ Kỵ Sĩ Nguyền Rủa', level: 160, rarity: 'Common', element: 'Void', hp: 25000, atk: 6500, gold: 7000, exp: 18000, image: 'cursed_knight_a.png' },
            { code: 5003, id: 'ruin_guardian_a', name: '🤖 Hộ Vệ Di Tích', level: 170, rarity: 'Rare', element: 'Earth', hp: 40000, atk: 12000, gold: 15000, exp: 45000, image: 'ruin_guardian_a.png' },
            { code: 5004, id: 'skeleton_king_a', name: '💀 Vua Xương Vương', level: 190, rarity: 'Elite', element: 'Void', hp: 120000, atk: 35000, gold: 100000, exp: 350000, image: 'skeleton_king_a.png' },
            { code: 5005, id: 'ancient_dragon_a', name: '🐲 Hồn Rồng Cổ Đại', level: 220, rarity: 'Elite', element: 'Light', hp: 300000, atk: 85000, gold: 300000, exp: 1200000, image: 'ancient_dragon_a.png' },
            { code: 5006, id: 'ruin_stalker_a', name: '👣 Kẻ Rình Rập Di Tích', level: 155, rarity: 'Common', element: 'Wind', hp: 18000, atk: 7500, gold: 6000, exp: 15000, image: 'ruin_stalker_a.png' },
            { code: 5007, id: 'stone_construct_a', name: '🗿 Thực Thể Đá Cổ', level: 165, rarity: 'Common', element: 'Earth', hp: 35000, atk: 5500, gold: 8500, exp: 20000, image: 'stone_construct_a.png' },
            { code: 5008, id: 'shadow_priest_a', name: '🔮 Linh Mục Bóng Tối', level: 175, rarity: 'Rare', element: 'Void', hp: 28000, atk: 22000, gold: 25000, exp: 60000, image: 'shadow_priest_a.png' },
            { code: 5009, id: 'fallen_hero_a', name: '⚔️ Tiếng Vọng Anh Hùng', level: 210, rarity: 'Rare', element: 'Light', hp: 80000, atk: 45000, gold: 50000, exp: 150000, image: 'fallen_hero_a.png' },
            { code: 5010, id: 'time_eater', name: '⌛ Kẻ Ăn Thời Gian', level: 250, rarity: 'Elite', element: 'Void', hp: 500000, atk: 120000, gold: 400000, exp: 2500000, image: 'time_eater.png' },
            { code: 5011, id: 'relic_mimic', name: '🏺 Cổ Vật Giả Mạo', level: 152, rarity: 'Common', element: 'Earth', hp: 15000, atk: 4000, gold: 12000, exp: 30000, image: 'relic_mimic.png' },
            { code: 5012, id: 'ancient_wisp', name: '✨ Đốm Sáng Cổ Đại', level: 151, rarity: 'Common', element: 'Light', hp: 10000, atk: 3500, gold: 4000, exp: 10000, image: 'ancient_wisp.png' },
            { code: 5013, id: 'ruin_basilisk', name: '🦎 Tử Xà Di Tích', level: 185, rarity: 'Rare', element: 'Wood', hp: 45000, atk: 25000, gold: 35000, exp: 90000, image: 'ruin_basilisk.png' },
            { code: 5014, id: 'lost_soul', name: '👻 Linh Hồn Lạc Lối', level: 158, rarity: 'Common', element: 'Void', hp: 16000, atk: 9000, gold: 7500, exp: 18000, image: 'lost_soul.png' },
            { code: 5015, id: 'pharaoh_shadow', name: '🌑 Bóng Ma Pharaoh', level: 230, rarity: 'Rare', element: 'Void', hp: 150000, atk: 65000, gold: 120000, exp: 500000, image: 'pharaoh_shadow.png' }
        ],
        events: [
            { code: 1141, id: 'ancient_trap', text: 'Bạn dẫm phải bẫy gai cổ đại rỉ sét.', damage: 250 },
            { code: 1142, id: 'blessing', text: 'Chạm vào cột đá, bạn cảm nhận được lời chúc phúc linh thiêng.', heal: 1000 },
            { code: 1143, id: 'relic_discovery', text: 'Bạn tìm thấy một cổ vật còn nguyên vẹn.', gold: 1500 },
            { code: 1144, id: 'mural_study', text: 'Nghiên cứu các bức bích họa cổ giúp bạn hiểu thêm về lịch sử.', exp: 2000 },
            { code: 1145, id: 'cursed_mist', text: 'Làn sương nguyền rủa bào mòn sinh lực của bạn.', damage: 300 },
            { code: 1146, id: 'goblin_camp', text: 'Bạn đột kích một trại yêu tinh và lấy được vàng.', gold: 2000 },
            { code: 1147, id: 'life_fountain', text: 'Một vòi phun nước trường sinh giữa di tích.', heal: 1500 },
            { code: 1148, id: 'wisdom_statue', text: 'Bức tượng hiền triết truyền dạy kiến thức cho bạn.', exp: 3000 }
        ]
    },
    sky_islands: {
        name: '🍃 Phấn Đảo Trên Không',
        monsters: [
            { code: 6201, id: 'sky_slime', name: '☁️ Slime Mây Trắng', level: 200, rarity: 'Common', element: 'Wind', hp: 50000, atk: 15000, gold: 20000, exp: 50000, image: 'sky_slime.png' },
            { code: 6202, id: 'harpy_scout', name: '🦅 Harpy Trinh Sát', level: 210, rarity: 'Common', element: 'Wind', hp: 60000, atk: 22000, gold: 35000, exp: 85000, image: 'harpy_scout.png' },
            { code: 6203, id: 'thunder_bird', name: '⚡ Lôi Điểu Phẫn Nộ', level: 230, rarity: 'Rare', element: 'Wind', hp: 120000, atk: 45000, gold: 80000, exp: 250000, image: 'thunder_bird.png' },
            { code: 6204, id: 'pegasus_wild_s', name: '🦄 Thiên Mã Hoang Dã', level: 240, rarity: 'Rare', element: 'Light', hp: 100000, atk: 55000, gold: 120000, exp: 400000, image: 'pegasus_wild_s.png' },
            { code: 6205, id: 'zeus_herald', name: '⚡ Sứ Giả Của Zeus', level: 280, rarity: 'Elite', element: 'Light', hp: 500000, atk: 120000, gold: 500000, exp: 2000000, image: 'zeus_herald.png' },
            { code: 6206, id: 'wind_wisp_s', name: '🌀 Tinh Linh Gió', level: 205, rarity: 'Common', element: 'Wind', hp: 45000, atk: 18000, gold: 18000, exp: 45000, image: 'wind_wisp_s.png' },
            { code: 6207, id: 'floating_mimic_s', name: '📦 Rương Bay Giả', level: 215, rarity: 'Common', element: 'Wind', hp: 80000, atk: 25000, gold: 50000, exp: 120000, image: 'floating_mimic_s.png' },
            { code: 6208, id: 'valkyrie_warrior_s', name: '⚔️ Chiến Binh Valkyrie', level: 250, rarity: 'Rare', element: 'Light', hp: 150000, atk: 65000, gold: 180000, exp: 600000, image: 'valkyrie_warrior_s.png' },
            { code: 6209, id: 'sky_wyvern', name: '🐲 Thiên Long Wyvern', level: 270, rarity: 'Rare', element: 'Wind', hp: 250000, atk: 90000, gold: 300000, exp: 1000000, image: 'sky_wyvern.png' },
            { code: 6210, id: 'odin_crow', name: '🐦 Quạ Của Odin', level: 300, rarity: 'Elite', element: 'Void', hp: 800000, atk: 200000, gold: 1000000, exp: 5000000, image: 'odin_crow.png' },
            { code: 6211, id: 'wing_ghost', name: '👻 Hồn Ma Cánh Trắng', level: 202, rarity: 'Common', element: 'Void', hp: 48000, atk: 20000, gold: 22000, exp: 55000, image: 'wing_ghost.png' },
            { code: 6212, id: 'sky_lion', name: '🦁 Sư Tử Cánh Vàng', level: 220, rarity: 'Common', element: 'Light', hp: 100000, atk: 35000, gold: 45000, exp: 150000, image: 'sky_lion.png' },
            { code: 6213, id: 'cloud_spirit', name: '✨ Linh Hồn Đám Mây', level: 208, rarity: 'Common', element: 'Wind', hp: 52000, atk: 18000, gold: 25000, exp: 60000, image: 'cloud_spirit.png' },
            { code: 6214, id: 'gust_demon', name: '😈 Ác Quỷ Cuồng Phong', level: 235, rarity: 'Rare', element: 'Wind', hp: 110000, atk: 50000, gold: 75000, exp: 300000, image: 'gust_demon.png' },
            { code: 6215, id: 'icarus_shadow', name: '🌑 Bóng Ma Icarus', level: 260, rarity: 'Rare', element: 'Void', hp: 180000, atk: 80000, gold: 150000, exp: 800000, image: 'icarus_shadow.png' }
        ],
        events: [
            { code: 1151, id: 'wind_gust', text: 'Một cơn gió mạnh thổi bay bạn suýt ngã khỏi đảo.', damage: 400 },
            { code: 1152, id: 'cloud_berry', text: 'Bạn ăn một quả mây ngọt lịm hồi phục sức khỏe.', heal: 2000 },
            { code: 1153, id: 'feather_hoard', text: 'Bạn nhặt được những chiếc lông vũ vàng ròng.', gold: 5000 },
            { code: 1154, id: 'heavenly_view', text: 'Quang cảnh tuyệt mỹ tiếp thêm cảm hứng chiến đấu.', exp: 8000 },
            { code: 1155, id: 'thunder_strike', text: 'Sét đánh trúng đảo nổi nơi bạn đang đứng.', damage: 600 },
            { code: 1156, id: 'icarus_wing', text: 'Bạn tìm thấy đôi cánh sáp cũ nhưng vẫn khảm vàng.', gold: 8000 },
            { code: 1157, id: 'sky_spring', text: 'Dòng suối lơ lửng trên mây tỏa ngát hương thơm.', heal: 3000 },
            { code: 1158, id: 'air_meditation', text: 'Thiền định giữa không trung giúp bạn thăng tiến sức mạnh.', exp: 12000 }
        ]
    },
    the_void: {
        name: '🌌 Vực Hư Không',
        monsters: [
            { code: 7001, id: 'void_eye_v', name: '👁️ Nhãn Thần Hư Không', level: 300, rarity: 'Common', element: 'Void', hp: 150000, atk: 50000, gold: 80000, exp: 200000, image: 'void_eye_v.png' },
            { code: 7002, id: 'shadow_stalker_v', name: '🌑 Bóng Ma Rình Rập', level: 320, rarity: 'Common', element: 'Void', hp: 180000, atk: 65000, gold: 120000, exp: 350000, image: 'shadow_stalker_v.png' },
            { code: 7003, id: 'void_beast_v', name: '🧿 Quái Thú Hư Không', level: 350, rarity: 'Rare', element: 'Void', hp: 400000, atk: 120000, gold: 300000, exp: 1000000, image: 'void_beast_v.png' },
            { code: 7004, id: 'antigravity_core_v', name: '🌀 Antigravity Core', level: 500, rarity: 'Elite', element: 'Light', hp: 5000000, atk: 1000000, gold: 10000000, exp: 50000000, image: 'antigravity_core_v.png' },
            { code: 7005, id: 'void_dragon_v', name: '🐉 Void Dragon God', level: 450, rarity: 'Elite', element: 'Void', hp: 2000000, atk: 500000, gold: 5000000, exp: 20000000, image: 'void_dragon_v.png' },
            { code: 7006, id: 'dark_matter_v', name: '🌌 Vật Chất Tối', level: 310, rarity: 'Common', element: 'Void', hp: 160000, atk: 55000, gold: 90000, exp: 250000, image: 'dark_matter_v.png' },
            { code: 7007, id: 'entropy_glitch_v', name: '🌀 Lỗi Thực Tại', level: 330, rarity: 'Common', element: 'Void', hp: 220000, atk: 75000, gold: 150000, exp: 400000, image: 'entropy_glitch_v.png' },
            { code: 7008, id: 'void_reaver_v', name: '☄️ Kẻ Gặt Hư Không', level: 380, rarity: 'Rare', element: 'Void', hp: 600000, atk: 180000, gold: 600000, exp: 2500000, image: 'void_reaver_v.png' },
            { code: 7009, id: 'star_eater_v', name: '🌠 Kẻ Ăn Sao', level: 400, rarity: 'Rare', element: 'Void', hp: 800000, atk: 250000, gold: 800000, exp: 5000000, image: 'star_eater_v.png' },
            { code: 7010, id: 'universal_end_v', name: '💀 Sự Kết Thúc Của Vũ Trụ', level: 600, rarity: 'Elite', element: 'Void', hp: 20000000, atk: 5000000, gold: 50000000, exp: 200000000, image: 'universal_end_v.png' },
            { code: 7011, id: 'void_slime', name: '🌑 Slime Hư Không', level: 305, rarity: 'Common', element: 'Void', hp: 140000, atk: 45000, gold: 75000, exp: 180000, image: 'void_slime.png' },
            { code: 7012, id: 'black_hole', name: '🕳️ Mầm Mống Lỗ Đen', level: 420, rarity: 'Elite', element: 'Void', hp: 1500000, atk: 400000, gold: 2000000, exp: 12000000, image: 'black_hole.png' },
            { code: 7013, id: 'void_crawler', name: '🕷️ Kẻ Bò Hư Không', level: 315, rarity: 'Common', element: 'Void', hp: 170000, atk: 60000, gold: 100000, exp: 300000, image: 'void_crawler.png' },
            { code: 7014, id: 'cosmic_horror', name: '🐙 Nỗi Khiếp Sợ Vũ Trụ', level: 360, rarity: 'Rare', element: 'Void', hp: 700000, atk: 200000, gold: 700000, exp: 3000000, image: 'cosmic_horror.png' },
            { code: 7015, id: 'nothingness', name: '⚪ Hư Vô Tối Thượng', level: 1000, rarity: 'Elite', element: 'Void', hp: 100000000, atk: 10000000, gold: 100000000, exp: 1000000000, image: 'nothingness.png' }
        ],
        events: [
            { code: 1161, id: 'void_siphon', text: 'Hư không rỉ sét hút lấy năng lượng sống của bạn.', damage: 1000 },
            { code: 1162, id: 'dark_energy', text: 'Bạn hấp thụ luồng năng lượng bóng tối.', heal: 5000 },
            { code: 1163, id: 'glitch_treasure', text: 'Bạn nhặt được những đồng vàng từ một lỗi thực tại.', gold: 20000 },
            { code: 1164, id: 'void_revelation', text: 'Nhìn vào vực thẳm, bạn thấu hiểu chân lý vũ trụ.', exp: 50000 },
            { code: 1165, id: 'reality_collapse', text: 'Không gian xung quanh sụp đổ khiến bạn bị thương nặng.', damage: 2000 },
            { code: 1166, id: 'lost_star', text: 'Bạn tìm thấy một ngôi sao đã tắt chứa đầy bụi vàng.', gold: 50000 },
            { code: 1167, id: 'void_essence', text: 'Tinh hoa hư không hồi phục thực thể cho bạn.', heal: 10000 },
            { code: 1168, id: 'eternal_wisdom', text: 'Tiếng thì thầm của hư không truyền thụ kiến thức tối thượng.', exp: 100000 }
        ]
    },
    lava_caverns: {
        name: '🌋 Động Dung Nham',
        monsters: [
            { code: 8001, id: 'lava_slime', name: '🔥 Slime Dung Nham', level: 250, rarity: 'Common', element: 'Fire', hp: 150000, atk: 45000, gold: 50000, exp: 120000, image: 'lava_slime.png' },
            { code: 8002, id: 'magma_golem', name: '🧱 Người Đá Nham Thạch', level: 300, rarity: 'Rare', element: 'Fire', hp: 500000, atk: 120000, gold: 200000, exp: 500000, image: 'magma_golem.png' },
            { code: 8003, id: 'fire_demon', name: '😈 Ác Quỷ Hỏa Ngục', level: 350, rarity: 'Elite', element: 'Fire', hp: 1500000, atk: 400000, gold: 1000000, exp: 3000000, image: 'fire_demon.png' },
            { code: 8004, id: 'lava_hound', name: '🐕 Chó Săn Nham Thạch', level: 260, rarity: 'Common', element: 'Fire', hp: 180000, atk: 55000, gold: 60000, exp: 150000, image: 'lava_hound.png' },
            { code: 8005, id: 'vulcan_warrior', name: '⚔️ Chiến Binh Hỏa Diện', level: 280, rarity: 'Common', element: 'Fire', hp: 250000, atk: 75000, gold: 80000, exp: 200000, image: 'vulcan_warrior.png' },
            { code: 8006, id: 'magma_turtle', name: '🐢 Rùa Dung Nham', level: 270, rarity: 'Common', element: 'Fire', hp: 350000, atk: 40000, gold: 70000, exp: 180000, image: 'magma_turtle.png' },
            { code: 8007, id: 'fire_breather', name: '🔥 Kẻ Phun Lửa', level: 265, rarity: 'Common', element: 'Fire', hp: 200000, atk: 85000, gold: 75000, exp: 170000, image: 'fire_breather.png' },
            { code: 8008, id: 'obsidian_golem', name: '🧱 Golem Đá Vỏ Chai', level: 320, rarity: 'Rare', element: 'Earth', hp: 800000, atk: 150000, gold: 300000, exp: 800000, image: 'obsidian_golem.png' },
            { code: 8009, id: 'hell_fire_spirit', name: '✨ Tinh Linh Lửa Ngục', level: 290, rarity: 'Rare', element: 'Fire', hp: 400000, atk: 200000, gold: 250000, exp: 600000, image: 'hell_fire_spirit.png' },
            { code: 8010, id: 'ancient_lava_dragon', name: '🐲 Cổ Long Dung Nham', level: 400, rarity: 'Elite', element: 'Fire', hp: 5000000, atk: 1200000, gold: 2000000, exp: 8000000, image: 'ancient_lava_dragon.png' }
        ],
        events: [
            { code: 1171, id: 'magma_burn', text: 'Bạn lỡ chân dẫm vào dòng dung nham nóng hổi.', damage: 1500 },
            { code: 1172, id: 'fire_essence', text: 'Tinh hoa lửa bao quanh hồi phục năng lượng cho bạn.', heal: 8000 },
            { code: 1173, id: 'volcanic_gold', text: 'Bạn tìm thấy vàng thô trong các khối nham thạch.', gold: 30000 },
            { code: 1174, id: 'inferno_vision', text: 'Nhìn vào ngọn lửa vĩnh cửu, bạn thấu hiểu sức mạnh của hỏa.', exp: 80000 },
            { code: 1175, id: 'sulfur_gas', text: 'Khí lưu huỳnh nồng nặc khiến bạn cảm thấy khó thở.', damage: 2000 },
            { code: 1176, id: 'obsidian_chest', text: 'Một rương đá vỏ chai chứa đầy châu báu.', gold: 50000 },
            { code: 1177, id: 'phoenix_tear', text: 'Giọt lệ phượng hoàng chữa lành mọi vết thương hỏa bỏng.', heal: 15000 },
            { code: 1178, id: 'magma_meditation', text: 'Thiền định trong hơi nóng giúp luyện tâm và trí.', exp: 150000 }
        ]
    },
    crystal_sanctuary: {
        name: '💎 Thánh Địa Tinh Thể',
        monsters: [
            { code: 9001, id: 'crystal_spirit', name: '✨ Linh Hồn Tinh Thể', level: 400, rarity: 'Common', element: 'Light', hp: 400000, atk: 150000, gold: 150000, exp: 500000, image: 'crystal_spirit.png' },
            { code: 9002, id: 'prism_guard', name: '🛡️ Hộ Vệ Lăng Kính', level: 450, rarity: 'Rare', element: 'Light', hp: 1000000, atk: 350000, gold: 500000, exp: 1500000, image: 'prism_guard.png' },
            { code: 9003, id: 'diamond_dragon', name: '🐲 Rồng Kim Cương', level: 500, rarity: 'Elite', element: 'Light', hp: 10000000, atk: 2500000, gold: 5000000, exp: 10000000, image: 'diamond_dragon.png' },
            { code: 9004, id: 'mirror_specter', name: '👻 Bóng Ma Gương', level: 410, rarity: 'Common', element: 'Void', hp: 450000, atk: 180000, gold: 180000, exp: 600000, image: 'mirror_specter.png' },
            { code: 9005, id: 'crystal_leopard', name: '🐆 Báo Gấm Pha Lê', level: 420, rarity: 'Common', element: 'Light', hp: 500000, atk: 220000, gold: 200000, exp: 700000, image: 'crystal_leopard.png' },
            { code: 9006, id: 'shard_golem', name: '🧱 Golem Mảnh Vụn', level: 430, rarity: 'Common', element: 'Earth', hp: 700000, atk: 120000, gold: 220000, exp: 800000, image: 'shard_golem.png' },
            { code: 9007, id: 'prism_weaver', name: '🕸️ Kẻ Dệt Lăng Kính', level: 440, rarity: 'Common', element: 'Light', hp: 550000, atk: 250000, gold: 250000, exp: 900000, image: 'prism_weaver.png' },
            { code: 9008, id: 'diamond_stinger', name: '🐝 Ong Bắp Cày Kim Cương', level: 460, rarity: 'Rare', element: 'Earth', hp: 1200000, atk: 450000, gold: 800000, exp: 2500000, image: 'diamond_stinger.png' },
            { code: 9009, id: 'crystalline_knight', name: '⚔️ Kỵ Sĩ Pha Lê', level: 480, rarity: 'Rare', element: 'Light', hp: 2500000, atk: 600000, gold: 1200000, exp: 4000000, image: 'crystalline_knight.png' },
            { code: 9010, id: 'prismatic_hydra', name: '🐉 Hydra Đa Sắc', level: 550, rarity: 'Elite', element: 'Light', hp: 15000000, atk: 3500000, gold: 10000000, exp: 20000000, image: 'prismatic_hydra.png' }
        ],
        events: [
            { code: 1181, id: 'crystal_cut', text: 'Mảnh tinh thể nhọn hoắt cứa đứt da thịt bạn.', damage: 3000 },
            { code: 1182, id: 'prism_heal', text: 'Ánh sáng tán sắc qua lăng kính phục hồi sinh lực.', heal: 20000 },
            { code: 1183, id: 'diamond_dust', text: 'Bạn thu thập được bụi kim cương quý hiếm.', gold: 100000 },
            { code: 1184, id: 'shard_insight', text: 'Nhìn vào mảnh vỡ tinh thể, bạn thấy được tương lai.', exp: 200000 },
            { code: 1185, id: 'blinding_light', text: 'Luồng sáng chói lòa làm bạn choáng váng.', damage: 4000 },
            { code: 1186, id: 'rare_gem', text: 'Bạn tìm thấy một viên ngọc vô giá.', gold: 200000 },
            { code: 1187, id: 'radiant_energy', text: 'Năng lượng rực rỡ lấp đầy cơ thể bạn.', heal: 35000 },
            { code: 1188, id: 'crystal_resonance', text: 'Hòa mình vào nhịp đập của thánh địa.', exp: 400000 }
        ]
    },
    heavenly_gates: {
        name: '👼 Cổng Thiên Giới',
        monsters: [
            { code: 10001, id: 'angel_warrior', name: '⚔️ Thiên Binh', level: 600, rarity: 'Common', element: 'Light', hp: 2000000, atk: 800000, gold: 500000, exp: 2000000, image: 'angel_warrior.png' },
            { code: 10002, id: 'seraphim', name: '👼 Lục Tự Thiên Sứ', level: 800, rarity: 'Rare', element: 'Light', hp: 10000000, atk: 4000000, gold: 2000000, exp: 10000000, image: 'seraphim.png' },
            { code: 10003, id: 'god_rpg', name: '🌌 Đấng Sáng Thế RPG', level: 2000, rarity: 'Elite', element: 'Light', hp: 999999999, atk: 99999999, gold: 999999999, exp: 999999999, image: 'god_rpg.png' },
            { code: 10004, id: 'cherub_scout', name: '🏹 Tiểu Thiên Sứ Trinh Sát', level: 620, rarity: 'Common', element: 'Light', hp: 2500000, atk: 900000, gold: 600000, exp: 2500000, image: 'cherub_scout.png' },
            { code: 10005, id: 'virtue_shield', name: '🛡️ Khiên Thần Đức Hạnh', level: 650, rarity: 'Common', element: 'Light', hp: 5000000, atk: 500000, gold: 800000, exp: 3000000, image: 'virtue_shield.png' },
            { code: 10006, id: 'light_spirit', name: '✨ Linh Hồn Ánh Sáng', level: 630, rarity: 'Common', element: 'Light', hp: 2200000, atk: 1000000, gold: 700000, exp: 2200000, image: 'light_spirit.png' },
            { code: 10007, id: 'judgment_guard', name: '⚖️ Hộ Vệ Phán Quyết', level: 700, rarity: 'Common', element: 'Light', hp: 4000000, atk: 1500000, gold: 1200000, exp: 4000000, image: 'judgment_guard.png' },
            { code: 10008, id: 'seraphim_warrior', name: '⚔️ Chiến Binh Thiên Sứ', level: 850, rarity: 'Rare', element: 'Light', hp: 15000000, atk: 5000000, gold: 5000000, exp: 12000000, image: 'seraphim_warrior.png' },
            { code: 10009, id: 'throne_watcher', name: '👁️ Kẻ Canh Giữ Ngai Vàng', level: 900, rarity: 'Rare', element: 'Void', hp: 20000000, atk: 6000000, gold: 8000000, exp: 15000000, image: 'throne_watcher.png' },
            { code: 10010, id: 'archangel_michael_s', name: '🌌 Tổng Lãnh Thiên Thần Michael', level: 1500, rarity: 'Elite', element: 'Light', hp: 100000000, atk: 25000000, gold: 50000000, exp: 100000000, image: 'archangel_michael_s.png' }
        ],
        events: [
            { code: 1191, id: 'divine_judgment', text: 'Tội lỗi của bạn bị phán xét bởi ánh sáng.', damage: 10000 },
            { code: 1192, id: 'grace_of_god', text: 'Sự khoan dung của đấng tối cao hồi phục hoàn toàn cho bạn.', heal: 1000000 },
            { code: 1193, id: 'heavenly_gold', text: 'Bạn được ban tặng những thỏi vàng từ thiên giới.', gold: 500000 },
            { code: 1194, id: 'sacred_enlightenment', text: 'Bạn đạt được sự giác ngộ thiêng liêng.', exp: 1000000 },
            { code: 1195, id: 'holy_fire', text: 'Lửa thánh thiêu đốt những gì không thuần khiết.', damage: 20000 },
            { code: 1196, id: 'angel_offering', text: 'Các thiên thần dâng tặng cho bạn lễ vật.', gold: 1000000 },
            { code: 1197, id: 'ethereal_blessing', text: 'Lời chúc phúc vô hình bảo bọc cơ thể bạn.', heal: 100000 },
            { code: 1198, id: 'divine_knowledge', text: 'Tiếp nhận kho tàng kiến thức của thiên giới.', exp: 5000000 }
        ]
    }
};

module.exports.getRegion = function(regionId) {
    return this[regionId] || null;
};

module.exports.getMonster = function(monsterId) {
    for (const region in this) {
        if (typeof this[region] !== 'object' || !this[region].monsters) continue;
        const monster = this[region].monsters.find(m => m.id === monsterId || m.code == monsterId);
        if (monster) return monster;
    }
    return null;
};

module.exports.getEvent = function(eventId) {
    for (const region in this) {
        if (typeof this[region] !== 'object' || !this[region].events) continue;
        const event = this[region].events.find(e => e.id === eventId || e.code == eventId);
        if (event) return event;
    }
    return null;
};
