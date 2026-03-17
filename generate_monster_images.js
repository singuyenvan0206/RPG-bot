/**
 * Script tạo ảnh cho các monster còn placeholder
 * Dùng: node generate_monster_images.js
 *
 * Yêu cầu: GEMINI_API_KEY trong file .env hoặc set thẳng bên dưới
 * API docs: https://ai.google.dev/api/images
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const BASE_DIR = path.join(__dirname, 'src', 'assets', 'monsters');
const PLACEHOLDER_SIZE = 619157; // bytes – size của file placeholder
const DELAY_MS = 4000;           // delay giữa mỗi request (tránh rate limit)
// ───────────────────────────────────────────────────────────────────────────

/** Danh sách toàn bộ monster còn thiếu ảnh */
const MONSTERS = [
  // ── ANCIENT RUINS ──────────────────────────────────────────────────────
  {
    zone: 'ancient_ruins', file: 'ancient_wisp',
    prompt: 'An ancient wisp monster, ghostly floating orb of pale golden ancient energy, trails of ghostly light, fragments of ancient runes orbiting it, crumbling ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'cursed_knight_a',
    prompt: 'A cursed knight undead monster, heavily armored skeletal warrior with cracked black armor, glowing purple eyes, dark curse energy surrounding armor, ancient crumbling ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'fallen_hero_a',
    prompt: 'A fallen hero undead champion monster, once-noble warrior now undead with tattered glorious armor, haunted glowing eyes, ethereal ghostly glow, ancient ruins setting, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'gargoyle_a',
    prompt: 'A gargoyle stone monster, menacing winged gargoyle with grey stone body cracked with glowing arcane veins, sharp claws and horns, perched on ancient ruins, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'lost_soul',
    prompt: 'A lost soul ghost monster, translucent sorrowful spirit drifting in ancient ruins, pale blue ethereal glow, face twisted in anguish, chains dragging behind it, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'pharaoh_shadow',
    prompt: 'A pharaoh shadow undead boss monster, shadowy dark silhouette of an ancient Egyptian pharaoh with golden crown and glowing red eyes, hieroglyphs glowing around it, ancient ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'relic_mimic',
    prompt: 'A relic mimic monster, ancient treasure chest or idol that sprouts tentacles and razor teeth, disguised as an archaeological artifact, ancient ruins setting, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'ruin_basilisk',
    prompt: 'A ruin basilisk monster, large lizard-like creature with stone-grey scales, glowing amber petrifying eyes, tail crashing through crumbling ancient columns, ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'ruin_guardian_a',
    prompt: 'A ruin guardian stone construct monster, massive ancient stone golem with glowing rune carvings, protective pose guarding ancient temple entrance, crumbling ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'ruin_stalker_a',
    prompt: 'A ruin stalker predator monster, sleek shadowy creature that blends with ancient stone walls, glowing yellow predator eyes, hunting silently through ruins, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'shadow_priest_a',
    prompt: 'A shadow priest undead mage monster, dark robed skeletal mage with shadowy aura, glowing purple hands casting dark spells, ancient ruins altar background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'stone_construct_a',
    prompt: 'A stone construct animated golem monster, humanoid figure built from ancient temple stone blocks, glowing ember eyes, ancient runes carved all over body, ancient ruins background, fantasy RPG game art style',
  },
  {
    zone: 'ancient_ruins', file: 'time_eater',
    prompt: 'A time eater eldritch monster, bizarre clock-like creature with multiple faces at different ages, gears and hourglass imagery in translucent body, reality warping around it, fantasy RPG game art style',
  },

  // ── LAVA CAVERNS ───────────────────────────────────────────────────────
  {
    zone: 'lava_caverns', file: 'ancient_lava_dragon',
    prompt: 'An ancient lava dragon boss monster, enormous ancient dragon with obsidian black scales cracked with glowing magma, fire breath, wings of molten rock, lava cavern background, fantasy RPG epic art style',
  },
  {
    zone: 'lava_caverns', file: 'fire_breather',
    prompt: 'A fire breather monster, large fearsome lizard creature exhaling massive column of flame, scarlet red scales, rocky lava cave background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'fire_demon',
    prompt: 'A fire demon monster, powerful demonic entity made of living flame, curved horns, clawed hands, wings of fire, hovering above lava pool, fantasy RPG game art style, dramatic lighting',
  },
  {
    zone: 'lava_caverns', file: 'hell_fire_spirit',
    prompt: 'A hellfire spirit elemental, screaming demonic face within swirling column of hellfire, deep red and black flames, lava cavern background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'lava_hound',
    prompt: 'A lava hound monster, large dog-like creature made of molten rock and magma, fire mane, glowing ember eyes, dripping magma from paws, rocky volcanic cave background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'lava_slime',
    prompt: 'A lava slime monster, round molten rock slime with glowing orange lava core visible inside, dripping magma body, rocky volcanic ground, fantasy RPG game art style, chibi style',
  },
  {
    zone: 'lava_caverns', file: 'magma_golem',
    prompt: 'A magma golem monster, large humanoid stone golem with body cracked revealing flowing magma underneath, glowing ember eyes, lava cavern background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'magma_turtle',
    prompt: 'A magma turtle monster, enormous turtle with volcanic rock shell cracked with glowing lava lines, fire-breathing head, lava pool background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'obsidian_golem',
    prompt: 'An obsidian golem monster, giant humanoid shaped from sharp black obsidian volcanic glass, glowing red eyes, jagged crystalline body, lava cavern background, fantasy RPG game art style',
  },
  {
    zone: 'lava_caverns', file: 'vulcan_warrior',
    prompt: 'A vulcan warrior monster, muscular fire warrior clad in volcanic armor with magma flowing through cracks, wielding a flaming sword, volcano background, fantasy RPG game art style',
  },

  // ── CRYSTAL SANCTUARY ──────────────────────────────────────────────────
  {
    zone: 'crystal_sanctuary', file: 'crystal_leopard',
    prompt: 'A crystal leopard monster, sleek leopard with crystalline transparent body, rainbow prismatic refractions, gemstone rosette patterns, crystal cave background, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'crystal_spirit',
    prompt: 'A crystal spirit elemental, translucent humanoid spirit made of pure crystal energy, prismatic light refractions inside, floating gracefully, crystal sanctuary background, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'crystalline_knight',
    prompt: 'A crystalline knight monster, armored warrior entirely made of crystal, prismatic light reflecting from armor, holding a crystal sword, crystal cave background, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'diamond_dragon',
    prompt: 'A diamond dragon boss monster, enormous majestic dragon made of pure diamond, light refracting spectacularly through its body creating rainbow aura, crystal cave background, fantasy RPG epic art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'diamond_stinger',
    prompt: 'A diamond stinger monster, giant scorpion-like insect with diamond-hard transparent exoskeleton, razor stinger tail, glinting in crystal cave light, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'mirror_specter',
    prompt: 'A mirror specter ghost monster, flat reflective ghost that mimics the viewer, ghostly figure made of mirror shards, multiple reflections inside it, crystal sanctuary background, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'prism_guard',
    prompt: 'A prism guard monster, crystal golem guardian with body made of geometric prism shapes, rainbow light beams emitting from its joints, guarding crystal gate, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'prism_weaver',
    prompt: 'A prism weaver spider monster, large spider with translucent crystal body, weaving webs of solidified light, rainbow prism effects, crystal cave background, fantasy RPG game art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'prismatic_hydra',
    prompt: 'A prismatic hydra boss monster, multi-headed serpent with each head made of different colored crystal, rainbow energy breath attacks, crystal sanctuary background, fantasy RPG epic boss art style',
  },
  {
    zone: 'crystal_sanctuary', file: 'shard_golem',
    prompt: 'A shard golem monster, large golem made of thousands of sharp floating crystal shards orbiting a glowing core, crystal shards spinning dangerously, crystal cave background, fantasy RPG game art style',
  },

  // ── SKY ISLANDS ────────────────────────────────────────────────────────
  {
    zone: 'sky_islands', file: 'cloud_spirit',
    prompt: 'A cloud spirit elemental, fluffy white cloud that has formed a face and wispy arms, lightning sparking within its body, floating among sky islands, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'floating_mimic_s',
    prompt: 'A floating mimic monster, treasure chest with wings that flies through sky islands, toothy grin revealing fangs, wings flapping, sky island clouds background, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'gust_demon',
    prompt: 'A gust demon wind monster, swirling tornado-formed demonic entity with a fierce face in the center, wind blades around body, floating sky islands background, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'harpy_scout',
    prompt: 'A harpy scout monster, fierce winged woman with eagle talons and wings, sharp armor, holding a spear, scouting on sky island cliff edge, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'icarus_shadow',
    prompt: 'An Icarus shadow ghost monster, spectral silhouette of a figure with burned wax wings, sorrowful glowing eyes, trailing ethereal feathers, high sky background, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'odin_crow',
    prompt: 'An Odin crow monster, enormous mystical raven with runic markings on feathers, one glowing eye, storm clouds and sky island background, fantasy RPG game art style, Norse mythology inspired',
  },
  {
    zone: 'sky_islands', file: 'pegasus_wild_s',
    prompt: 'A wild pegasus monster, powerful wild white winged horse with stormy mane, lightning hooves, fierce eyes, sky island background, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'sky_lion',
    prompt: 'A sky lion monster, majestic golden lion with cloud-white wings, wind swirling around mane, standing proudly on floating sky island, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'sky_slime',
    prompt: 'A sky slime monster, round light blue translucent slime with wispy cloud texture, tiny wings, floating among clouds, big cute glowing eyes, fantasy RPG game art style, chibi style',
  },
  {
    zone: 'sky_islands', file: 'sky_wyvern',
    prompt: 'A sky wyvern monster, sleek lightning-fast wyvern with electric blue scales, crackling lightning on wings, sky island background with storm clouds, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'thunder_bird',
    prompt: 'A thunderbird monster, giant legendary eagle with lightning bolt feathers, crackling electricity on spread wings, storm cloud background, fantasy RPG game art style, epic composition',
  },
  {
    zone: 'sky_islands', file: 'valkyrie_warrior_s',
    prompt: 'A valkyrie warrior monster, powerful armored female warrior with golden winged helmet and spear, flying through clouds, sky island background, fantasy RPG game art style, Norse mythology inspired',
  },
  {
    zone: 'sky_islands', file: 'wind_wisp_s',
    prompt: 'A wind wisp elemental, small swirling orb of pure wind energy with tiny glowing face, little tornado body, floating among sky islands, fantasy RPG game art style, cute chibi style',
  },
  {
    zone: 'sky_islands', file: 'wing_ghost',
    prompt: 'A wing ghost monster, ethereal translucent ghost with massive feathered wings, hollow glowing eyes, drifting silently through sky island clouds, fantasy RPG game art style',
  },
  {
    zone: 'sky_islands', file: 'zeus_herald',
    prompt: 'A Zeus herald divine monster, divine messenger warrior in gleaming white armor with golden eagle wings, holding a thunder bolt, storm cloud sky island background, fantasy RPG game art style',
  },

  // ── ABYSS OCEAN ────────────────────────────────────────────────────────
  {
    zone: 'abyss_ocean', file: 'abyssal_crab_o',
    prompt: 'An abyssal crab monster, enormous deep-sea crab with glowing bioluminescent claws, crushing pincers, emerging from ocean abyss depths, dark deep ocean background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'abyssal_god',
    prompt: 'An abyssal god boss monster, incomprehensibly large eldritch entity from the ocean depths, multiple glowing eyes, mass of writhing tentacles, crushing dark abyss background, fantasy RPG epic boss art style',
  },
  {
    zone: 'abyss_ocean', file: 'bubble_slime',
    prompt: 'A bubble slime monster, translucent round ocean slime filled with bubbles, deep sea blue-green coloring, floating jellyfish-like, cute big eyes, deep ocean background, fantasy RPG game art style, chibi style',
  },
  {
    zone: 'abyss_ocean', file: 'coral_beast',
    prompt: 'A coral beast sea monster, large creature with body made of living colorful coral, barnacles and sea anemones growing on it, glowing eyes, deep ocean floor background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'deep_sea_angler_o',
    prompt: 'A deep sea angler fish monster, terrifying enormous anglerfish with massive jaws, bioluminescent lure, rows of sharp curved teeth, pitch black abyss ocean background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'deep_shark',
    prompt: 'A deep shark monster, monstrous prehistoric megalodon-like shark with glowing abyssal eyes, scarred armored skin, deep dark ocean background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'drowned_pirate_o',
    prompt: 'A drowned pirate undead monster, zombie pirate covered in seaweed and barnacles, waterlogged ragged pirate outfit, glowing green ghost eyes, sunken ship background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'electric_eel_o',
    prompt: 'An electric eel monster, enormous serpentine electric eel crackling with blue lightning, glowing electric patterns along body, dark abyss ocean background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'kraken_tentacle_o',
    prompt: 'A kraken tentacle monster, massive tentacle of a giant kraken breaking ocean surface, enormous suction cups and barnacles, glowing eye on tentacle tip, deep sea background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'leviathan_fragment_o',
    prompt: 'A leviathan fragment boss monster, massive piece of an ancient leviathan sea creature, enormous armored scales, glowing ancient runes, surrounding dark abyss ocean, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'ocean_spirit',
    prompt: 'An ocean spirit elemental, graceful luminous spirit made of swirling ocean water, glowing blue-green bioluminescent energy, long flowing watery form, deep sea background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'sea_serpent_o',
    prompt: 'A sea serpent monster, enormous coiling sea serpent with emerald green scales, rising from ocean depths, glowing amber eyes, stormy ocean surface background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'siren_o',
    prompt: 'A siren ocean monster, beautiful but deadly mermaid-like creature with glowing hypnotic eyes, sharp claws, iridescent fish tail, luring pose on underwater rock, deep ocean background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'triton_soldier',
    prompt: 'A triton soldier monster, blue-skinned merman warrior with shark-fin helmet, trident weapon, fish scale armor, underwater ruins battle background, fantasy RPG game art style',
  },
  {
    zone: 'abyss_ocean', file: 'void_whale_o',
    prompt: 'A void whale monster, enormous black whale-like creature partially phased into another dimension, dark energy trailing behind it, glowing purple eyes, deep ocean abyss background, fantasy RPG game art style',
  },

  // ── THE VOID ────────────────────────────────────────────────────────────
  {
    zone: 'the_void', file: 'antigravity_core_v',
    prompt: 'An antigravity core void monster, floating geometric shape with inverted gravity physics, reality bending around it, stars and void energy patterns, pure black void background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'black_hole',
    prompt: 'A black hole creature monster, living singularity that devours light, gravitational lensing visible around it, swirling accretion disk, pure void background, fantasy RPG game art style, cosmic horror',
  },
  {
    zone: 'the_void', file: 'cosmic_horror',
    prompt: 'A cosmic horror eldritch monster, incomprehensible lovecraftian entity, non-euclidean geometry body, hundreds of eyes, writhing tendrils, stars visible through its translucent body, void background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'dark_matter_v',
    prompt: 'A dark matter void elemental, invisible force given shape as dark swirling mass, gravity distortion visible around edges, deep void space background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'entropy_glitch_v',
    prompt: 'An entropy glitch monster, reality-breaking glitched creature, body appears pixelated and corrupted with static, fragments of deleted reality around it, void background with glitch effects, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'nothingness',
    prompt: 'A nothingness void entity monster, entity of pure absence and void, barely visible shadowy form with areas of complete darkness where eyes should be, reality dissolving around it, void background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'shadow_stalker_v',
    prompt: 'A shadow stalker void monster, predatory shadow creature from the void, barely visible black-on-black form with glowing purple void eyes, stalking through void darkness, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'star_eater_v',
    prompt: 'A star eater cosmic monster, enormous entity that consumes stars, mouth like a black hole, half-eaten star visible in cosmos behind it, void space background, fantasy RPG game art style, cosmic scale',
  },
  {
    zone: 'the_void', file: 'universal_end_v',
    prompt: 'A universal end boss monster, apocalyptic entity representing the end of all existence, massive incomprehensible form, universe crumbling around it, void space background, fantasy RPG ultimate boss art style',
  },
  {
    zone: 'the_void', file: 'void_beast_v',
    prompt: 'A void beast monster, quadruped predator made of living darkness with glowing void eyes, void energy rippling off body, pure black void background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'void_crawler',
    prompt: 'A void crawler monster, many-legged spider-like creature that moves through void dimensions, body phasing between realities, glowing eyes in darkness, void black background, fantasy RPG game art style',
  },
  {
    zone: 'the_void', file: 'void_dragon_v',
    prompt: 'A void dragon boss monster, enormous dragon made of pure void darkness, body absorbing light around it, glowing purple void eyes, constellation patterns visible inside body, cosmic void background, fantasy RPG epic art style',
  },
  {
    zone: 'the_void', file: 'void_eye_v',
    prompt: 'A void eye monster, massive floating eye that sees all realities, pupil is a black hole, dark void tentacles extending from eye socket, cosmic void background, fantasy RPG game art style, eldritch horror',
  },
  {
    zone: 'the_void', file: 'void_slime',
    prompt: 'A void slime monster, dark purple-black slime that absorbs light, swirling cosmos visible inside translucent body, floating in void, big eerie glowing eyes, fantasy RPG game art style, chibi style',
  },

  // ── HEAVENLY GATES ─────────────────────────────────────────────────────
  {
    zone: 'heavenly_gates', file: 'angel_warrior',
    prompt: 'An angel warrior monster, powerful divine soldier with gleaming white and gold armor, large white feathered wings, holy sword, heavenly cloud background, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'archangel_michael_s',
    prompt: 'An archangel Michael monster, supreme archangel in golden divine armor, enormous wings, wielding flaming sword of judgment, heavenly gates background, fantasy RPG epic boss art style',
  },
  {
    zone: 'heavenly_gates', file: 'cherub_scout',
    prompt: 'A cherub scout monster, small but surprisingly fierce cherub angel with tiny wings, shooting divine energy arrows, cute but dangerous, celestial cloud background, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'god_rpg',
    prompt: 'An ultimate God boss monster for RPG, divine golden radiant figure of immense power, blinding divine light aura, sitting on heavenly throne above clouds, fantasy RPG ultimate boss art style',
  },
  {
    zone: 'heavenly_gates', file: 'judgment_guard',
    prompt: 'A judgment guard angel monster, stern divine guardian angel in silver armor holding scales of judgment, stern expression, standing at heaven gates, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'light_spirit',
    prompt: 'A light spirit elemental, pure radiant spirit made of divine light, glowing warm golden form, angelic energy wings, heavenly cloud background, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'seraphim',
    prompt: 'A seraphim six-winged angel monster, ancient seraphim angel with six blazing wings, human face, covered in divine fire, floating above heavenly clouds, fantasy RPG game art style, biblical inspired',
  },
  {
    zone: 'heavenly_gates', file: 'seraphim_warrior',
    prompt: 'A seraphim warrior angel monster, battle-ready seraphim with six wings in full divine armor, divine sword and shield, heavenly battlefield background, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'throne_watcher',
    prompt: 'A throne watcher divine monster, ancient heavenly guardian with wheel-like body covered in eyes, ophanim angel design, glowing divine fire rings, heavenly gates background, fantasy RPG game art style',
  },
  {
    zone: 'heavenly_gates', file: 'virtue_shield',
    prompt: 'A virtue shield angel monster, angelic guardian who embodies divine virtue, shining crystalline shield and armor, holy light radiating in all directions, heavenly cloud background, fantasy RPG game art style',
  },
];

// ─── HELPER: sleep ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── HELPER: Gemini Imagen API call ────────────────────────────────────────
async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;
  const body = JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount: 1 },
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error(`RATE_LIMIT: ${data}`));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
          if (!b64) reject(new Error('No image data in response'));
          else resolve(Buffer.from(b64, 'base64'));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── HELPER: filter chỉ những file còn là placeholder ───────────────────────
function isPlaceholder(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size === PLACEHOLDER_SIZE;
  } catch {
    return true; // file không tồn tại → cũng cần tạo
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('❌  Hãy set GEMINI_API_KEY trong file .env hoặc sửa trực tiếp trong script!');
    process.exit(1);
  }

  // Lọc danh sách cần tạo (bỏ qua những file đã có ảnh thật)
  const todo = MONSTERS.filter((m) => {
    const dest = path.join(BASE_DIR, m.zone, `${m.file}.png`);
    return isPlaceholder(dest);
  });

  console.log(`🎨  Tổng số ảnh cần tạo: ${todo.length} / ${MONSTERS.length}`);
  if (todo.length === 0) {
    console.log('✅  Tất cả ảnh đã được tạo rồi!');
    return;
  }

  let successCount = 0;
  let failedList = [];

  for (let i = 0; i < todo.length; i++) {
    const { zone, file, prompt } = todo[i];
    const dest = path.join(BASE_DIR, zone, `${file}.png`);
    const label = `[${i + 1}/${todo.length}] ${zone}/${file}`;

    process.stdout.write(`${label} ... `);

    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        const imgBuffer = await generateImage(prompt);
        fs.writeFileSync(dest, imgBuffer);
        console.log(`✅  (${imgBuffer.length} bytes)`);
        successCount++;
        success = true;
      } catch (err) {
        if (err.message.startsWith('RATE_LIMIT')) {
          console.log(`\n⏳  Rate limit! Chờ 60 giây rồi thử lại...`);
          await sleep(60000);
        } else {
          retries--;
          console.log(`\n⚠️   Lỗi (còn ${retries} lần thử): ${err.message}`);
          if (retries > 0) await sleep(5000);
        }
      }
    }

    if (!success) {
      failedList.push(`${zone}/${file}`);
      console.log(`❌  Bỏ qua ${file}`);
    }

    // Delay giữa các request để tránh rate limit
    if (i < todo.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅  Thành công: ${successCount}/${todo.length}`);
  if (failedList.length > 0) {
    console.log(`❌  Thất bại (${failedList.length}):`);
    failedList.forEach((f) => console.log(`   - ${f}`));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
