const skillsData = require('./skillsData');

const shopItems = {
    general_store: [
        // Consumables
        { code: 901, id: 'medicinal_herb', price: 50, type: 'material' },
        { code: 902, id: 'healing_potion', price: 200, type: 'consumable', name: '🧪 Thuốc Hồi Máu', desc: 'Hồi 100 HP ngay lập tức.' },
        { code: 903, id: 'mana_potion', price: 150, type: 'consumable', name: '🧪 Thuốc Hồi Mana', desc: 'Hồi 50 Mana ngay lập tức.' },

        // Basic Weapons
        { code: 904, id: 'sharp_stick', price: 100, type: 'weapon' },
        { code: 905, id: 'rusted_sword', price: 250, type: 'weapon' },
        { code: 906, id: 'iron_dagger', price: 300, type: 'weapon' },
        { code: 907, id: 'wooden_bow', price: 280, type: 'weapon' },
        { code: 908, id: 'apprentice_wand', price: 320, type: 'weapon' },

        // Basic Armor
        { code: 909, id: 'leather_tunic', price: 400, type: 'armor' },
        { code: 910, id: 'cloth_armor', price: 150, type: 'armor' },
        { code: 911, id: 'iron_chestplate', price: 1200, type: 'armor' },

        // Accessories
        { code: 912, id: 'wolf_tooth', price: 500, type: 'accessory' },
        { code: 913, id: 'lucky_charm', price: 300, type: 'accessory' },

        // Materials
        { code: 914, id: 'iron_ore', price: 150, type: 'material' },
        { code: 915, id: 'bronze_scrap', price: 100, type: 'material' },
        { code: 916, id: 'oak_wood', price: 120, type: 'material' },
        { code: 917, id: 'slime_essence', price: 80, type: 'material' },
    ],

    black_market: [
        { code: 951, id: 'magic_core', price: 2000, type: 'material' },
        { code: 952, id: 'ruby', price: 1500, type: 'material' },
        { code: 953, id: 'emerald', price: 1500, type: 'material' },
        { code: 954, id: 'sapphire', price: 1500, type: 'material' },
        { code: 955, id: 'void_shard', price: 10000, type: 'material' },
    ],

    // Dynamic Skill Shops (keys match class names)
    skill_shops: {
        Warrior: [
            { code: 801, id: 'book_power_strike',  skill_id: 'power_strike',  price: 1000, name: '📕 Power Strike',   desc: '[Tier 1] Đòn chém 150% ATK Vật Lý.' },
            { code: 802, id: 'book_shield_block',  skill_id: 'shield_block',  price: 1000, name: '📕 Shield Block',   desc: '[Tier 1] Bị động: 15% chặn đòn.' },
            { code: 803, id: 'book_iron_wall',     skill_id: 'iron_wall',     price: 2500, name: '📕 Iron Wall',     desc: '[Tier 2] Bị động: DEF+25.' },
            { code: 804, id: 'book_earth_smash',   skill_id: 'earth_smash',   price: 2500, name: '📕 Earth Smash',   desc: '[Tier 2] Đất hệ, 180% ATK.' },
            { code: 805, id: 'book_battle_cry',    skill_id: 'battle_cry',    price: 5000, name: '📕 Battle Cry',    desc: '[Tier 3] Hồi 10% HP mỗi kích hoạt.' },
            { code: 806, id: 'book_fire_charge',   skill_id: 'fire_charge',   price: 5000, name: '📕 Fire Charge',   desc: '[Tier 3] Lửa hệ, 200% ATK.' },
            { code: 807, id: 'book_avatar_of_war', skill_id: 'avatar_of_war', price: 15000, name: '📕 Avatar of War', desc: '[Tier 4] Bị động: ATK+50 DEF+50.' }
        ],
        Mage: [
            { code: 811, id: 'book_fireball',        skill_id: 'fireball',        price: 1000,  name: '📕 Fireball',        desc: '[Tier 1] Lửa hệ, 130% ATK.' },
            { code: 812, id: 'book_arcane_intellect',skill_id: 'arcane_intellect',price: 1000,  name: '📕 Arcane Intellect',desc: '[Tier 1] Bị động: Mana+150.' },
            { code: 813, id: 'book_mana_overload',   skill_id: 'mana_overload',   price: 2500,  name: '📕 Mana Overload',   desc: '[Tier 2] Hư Không hệ, 160% ATK.' },
            { code: 814, id: 'book_ice_nova',        skill_id: 'ice_nova',        price: 2500,  name: '📕 Ice Nova',        desc: '[Tier 2] Băng hệ, 140% ATK.' },
            { code: 815, id: 'book_arcane_drain',    skill_id: 'arcane_drain',    price: 5000,  name: '📕 Arcane Drain',    desc: '[Tier 3] Hút sinh lực 8% + ATK.' },
            { code: 816, id: 'book_thunder_storm',   skill_id: 'thunder_storm',   price: 5000,  name: '📕 Thunder Storm',   desc: '[Tier 3] Phong hệ, 220% ATK.' },
            { code: 817, id: 'book_archmage_focus',  skill_id: 'archmage_focus',  price: 15000, name: '📕 Archmage Focus',  desc: '[Tier 4] Bị động: ATK+60 Mana+200.' }
        ],
        Ranger: [
            { code: 821, id: 'book_double_shot',      skill_id: 'double_shot',      price: 1000,  name: '📕 Double Shot',      desc: '[Tier 1] Vật Lý, 200% ATK.' },
            { code: 822, id: 'book_eagle_eye',        skill_id: 'eagle_eye',        price: 1000,  name: '📕 Eagle Eye',        desc: '[Tier 1] Bị động: Crit+8%.' },
            { code: 823, id: 'book_wind_walk',        skill_id: 'wind_walk',        price: 2500,  name: '📕 Wind Walk',        desc: '[Tier 2] Bị động: AGI+40.' },
            { code: 824, id: 'book_poison_arrow',     skill_id: 'poison_arrow',     price: 2500,  name: '📕 Poison Arrow',     desc: '[Tier 2] Độc hệ, 80% ATK + 200 độc.' },
            { code: 825, id: 'book_explosive_shot',   skill_id: 'explosive_shot',   price: 5000,  name: '📕 Explosive Shot',   desc: '[Tier 3] Lửa hệ, 250% ATK.' },
            { code: 826, id: 'book_volley',           skill_id: 'volley',           price: 5000,  name: '📕 Volley',           desc: '[Tier 3] Vật Lý, mưa tên 180% ATK.' },
            { code: 827, id: 'book_phantom_marksman', skill_id: 'phantom_marksman', price: 15000, name: '📕 Phantom Marksman', desc: '[Tier 4] Bị động: ATK+40 AGI+30 Crit+5%.' }
        ],
        Assassin: [
            { code: 831, id: 'book_critical_strike', skill_id: 'critical_strike', price: 1000,  name: '📕 Critical Strike', desc: '[Tier 1] Vật Lý, 180% ATK.' },
            { code: 832, id: 'book_shadow_cloak',    skill_id: 'shadow_cloak',    price: 1000,  name: '📕 Shadow Cloak',    desc: '[Tier 1] Bị động: DEF+10 AGI+20.' },
            { code: 833, id: 'book_lethal_venom',    skill_id: 'lethal_venom',    price: 2500,  name: '📕 Lethal Venom',    desc: '[Tier 2] Bị động: 10% thêm 100 độc.' },
            { code: 834, id: 'book_backstab',        skill_id: 'backstab',        price: 2500,  name: '📕 Backstab',        desc: '[Tier 2] Hư Không hệ, 220% ATK.' },
            { code: 835, id: 'book_death_mark',      skill_id: 'death_mark',      price: 5000,  name: '📕 Death Mark',      desc: '[Tier 3] Hư Không hệ, 280% ATK.' },
            { code: 836, id: 'book_smoke_bomb',      skill_id: 'smoke_bomb',      price: 5000,  name: '📕 Smoke Bomb',      desc: '[Tier 3] Hồi 12% HP.' },
            { code: 837, id: 'book_shadow_realm',    skill_id: 'shadow_realm',    price: 15000, name: '📕 Shadow Realm',    desc: '[Tier 4] Bị động: ATK+50 Crit+10%.' }
        ]
    }
};

module.exports = shopItems;
