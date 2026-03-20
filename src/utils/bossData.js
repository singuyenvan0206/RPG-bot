module.exports = {
    whispering_forest: {
        code: 2001,
        id: 'forest_boss',
        name: '👑 Hộ Vệ Cổ Thụ (Ancient Forest Guardian)',
        max_hp: 6000,
        atk: 280,
        drops: ['warrior_blade', 'heavy_plate', 'wooden_bow'],
        gold: 2000,
        exp: 4000,
        spawn_req: 25,
        image: 'forest_treant.png'
    },
    burning_desert: {
        code: 2002,
        id: 'desert_boss',
        name: '👑 Vua Bọ Cạp Lửa (Inferno Scorpion King)',
        max_hp: 10000,
        atk: 400,
        drops: ['fire_staff', 'ruby_ring', 'steel_axe'],
        gold: 3500,
        exp: 6000,
        spawn_req: 25,
        image: 'desert_scorp_d.png'
    },
    frozen_mountains: {
        code: 2003,
        id: 'mountain_boss',
        name: '👑 Rồng Băng Tuyết (Glacial Dragon)',
        max_hp: 15000,
        atk: 600,
        drops: ['iron_chestplate', 'wolf_tooth', 'silver_katana'],
        gold: 6000,
        exp: 10000,
        spawn_req: 30,
        image: 'ice_dragon_f.png'
    },
    abyss_ocean: {
        code: 2004,
        id: 'ocean_boss',
        name: '👑 Thủy Quái Kraken (Abyssal Kraken)',
        max_hp: 25000,
        atk: 900,
        drops: ['shadow_blade', 'void_mantle', 'wind_shuriken'],
        gold: 10000,
        exp: 18000,
        spawn_req: 35,
        image: 'kraken_tentacle_o.png'
    },
    ancient_ruins: {
        code: 2005,
        id: 'ruin_boss',
        name: '👑 Vua Khổng Lồ Mất Trí (Mad Titan King)',
        max_hp: 45000,
        atk: 1500,
        drops: ['holy_mace', 'ancient_relic'],
        gold: 20000,
        exp: 30000,
        spawn_req: 40,
        image: 'ruin_guardian_a.png'
    },
    the_void: {
        code: 2006,
        id: 'void_boss',
        name: '🌌 Kẻ Nuốt Chửng Ánh Sáng (The Void Devourer)',
        max_hp: 120000,
        atk: 3500,
        drops: ['dragon_slayer', 'dragon_scale_armor', 'ancient_relic'],
        gold: 80000,
        exp: 150000,
        spawn_req: 50,
        image: 'antigravity_core_v.png'
    }
};

module.exports.getBoss = function(bossId) {
    for (const region in this) {
        if (typeof this[region] !== 'object') continue;
        if (this[region].id === bossId || this[region].code == bossId) return this[region];
    }
    return null;
};

