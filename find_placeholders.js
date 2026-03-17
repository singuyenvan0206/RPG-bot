const fs = require('fs');
const path = require('path');
const rpgData = require('./src/utils/rpgData');

const ASSETS_BASE = path.join(__dirname, 'src/assets/monsters');
const PLACEHOLDER_SIZE = 619157;

const result = [];

for (const regionId in rpgData) {
    const region = rpgData[regionId];
    if (typeof region !== 'object' || !region.monsters) continue;

    region.monsters.forEach(monster => {
        if (!monster.image || monster.image.startsWith('http')) return;

        const monsterPath = path.join(ASSETS_BASE, regionId, monster.image);
        if (fs.existsSync(monsterPath)) {
            const stats = fs.statSync(monsterPath);
            if (stats.size === PLACEHOLDER_SIZE) {
                result.push({
                    id: monster.id,
                    name: monster.name,
                    region: regionId,
                    image: monster.image,
                    path: monsterPath
                });
            }
        } else {
            result.push({
                id: monster.id,
                name: monster.name,
                region: regionId,
                image: monster.image,
                path: monsterPath,
                missing: true
            });
        }
    });
}

console.log(JSON.stringify(result, null, 2));
