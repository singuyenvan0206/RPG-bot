const db = require('../database');
const itemsData = require('./itemsData');
const { sendGlobal } = require('./broadcast');
const sessionManager = require('./sessionManager');

async function processExpiredAuctions(client) {
    const now = Math.floor(Date.now() / 1000);
    const expired = await db.queryAll('SELECT * FROM market WHERE is_auction = true AND expire_at < $1', [now]);

    for (const l of expired) {
        try {
            if (l.highest_bidder_id) {
                const tax = Math.floor(l.current_bid * 0.10);
                const sellerRevenue = l.current_bid - tax;

                await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [sellerRevenue, l.seller_id]);
                await db.execute('INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [l.highest_bidder_id, l.item_id]);
                
                try {
                    const winner = await client.users.fetch(l.highest_bidder_id);
                    const item = itemsData.getItem(l.item_id);
                    await winner.send(`🎊 Chúc mừng! Bạn đã thắng đấu giá vật phẩm **${item?.name || l.item_id}** với giá **${l.current_bid.toLocaleString()} Vàng**!`);
                    await sendGlobal(client, 'ĐẤU GIÁ KẾT THÚC!', `<@${l.highest_bidder_id}> đã đấu giá thành công **${item?.name || l.item_id}** với giá **${l.current_bid.toLocaleString()} Vàng**!`, '#3498db');
                } catch (e) {}
            } else {
                await db.execute('INSERT INTO inventory (user_id, item_id, amount) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET amount = inventory.amount + 1', [l.seller_id, l.item_id]);
            }
            
            await db.execute('DELETE FROM market WHERE listing_id = $1', [l.listing_id]);
        } catch (err) {
            console.error(`[Scheduler] Auction error:`, err);
        }
    }
}

async function processSeasonReset(client) {
    const now = Math.floor(Date.now() / 1000);
    const state = await db.queryOne('SELECT value FROM world_states WHERE key = \'next_season_reset\'');
    const nextReset = state ? parseInt(state.value) : 0;

    if (now >= nextReset && nextReset > 0) {
        console.log('[Scheduler] Starting Season Reset...');
        const top = await db.queryAll('SELECT * FROM arena_stats ORDER BY elo DESC LIMIT 10');
        let rewardLog = `🏁 **MÙA GIẢI ĐÃ KẾT THÚC!**\nChúc mừng các chiến binh xuất sắc nhất:\n`;

        for (const [i, p] of top.entries()) {
            const rewardGold = (10 - i) * 10000;
            await db.execute('UPDATE players SET gold = gold + $1 WHERE user_id = $2', [rewardGold, p.user_id]);
            rewardLog += `${i + 1}. <@${p.user_id}>: ${p.elo} Elo (+${rewardGold.toLocaleString()} Vàng)\n`;
        }

        await db.execute('UPDATE arena_stats SET elo = 1000, wins = 0, losses = 0');
        const nextTime = now + (7 * 24 * 3600);
        await db.execute('UPDATE world_states SET value = $1 WHERE key = \'next_season_reset\'', [nextTime.toString()]);
        await sendGlobal(client, 'KẾT THÚC MÙA GIẢI!', rewardLog, '#f1c40f');
    } else if (!state) {
        const firstReset = now + (7 * 24 * 3600);
        await db.execute('INSERT INTO world_states (key, value) VALUES (\'next_season_reset\', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [firstReset.toString()]);
    }
}

async function processGlobalEvents(client) {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = (day === 0 || day === 6);
    
    const currentState = await db.queryOne('SELECT value FROM world_states WHERE key = \'global_exp_mult\'');
    const currentMult = currentState ? parseFloat(currentState.value) : 1.0;

    if (isWeekend && currentMult === 1.0) {
        await db.execute('INSERT INTO world_states (key, value) VALUES (\'global_exp_mult\', \'2.0\') ON CONFLICT (key) DO UPDATE SET value = \'2.0\'');
        await sendGlobal(client, 'SỰ KIỆN CUỐI TUẦN!', '🚀 **NHÂN ĐÔI KINH NGHIỆM (2x EXP)** đã được kích hoạt! Hãy tranh thủ thám hiểm ngay!', '#3498db');
    } else if (!isWeekend && currentMult > 1.0) {
        await db.execute('UPDATE world_states SET value = \'1.0\' WHERE key = \'global_exp_mult\'');
        await sendGlobal(client, 'SỰ KIỆN KẾT THÚC!', '📅 Sự kiện x2 EXP đã kết thúc. Hẹn gặp lại vào cuối tuần sau!', '#7f8c8d');
    } else if (!currentState) {
        await db.execute('INSERT INTO world_states (key, value) VALUES (\'global_exp_mult\', \'1.0\') ON CONFLICT (key) DO NOTHING');
    }
}

function startScheduler(client) {
    console.log('[Scheduler] Background tasks started.');
    setInterval(() => {
        processExpiredAuctions(client);
        processSeasonReset(client);
        processGlobalEvents(client);
        sessionManager.cleanup();
    }, 120000);
}

module.exports = { startScheduler };
