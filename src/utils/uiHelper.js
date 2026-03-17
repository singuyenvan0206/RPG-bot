function createHealthBar(current, max, emoji = null) {
    if (!max || max <= 0) return 'N/A';
    const size = 10;
    const percentage = Math.min(Math.max(0, current / max), 1);
    const filledLength = Math.round(percentage * size);
    const emptyLength = size - filledLength;
    
    let barColor = emoji || '🟩'; // Default Green
    if (!emoji) {
        if (percentage <= 0.2) barColor = '🟥'; // Red
        else if (percentage <= 0.5) barColor = '🟨'; // Yellow
    }
    
    const filledBar = barColor.repeat(filledLength);
    const emptyBar = '⬜'.repeat(emptyLength);
    return `${filledBar}${emptyBar} **${current}** / **${max}**`;
}

module.exports = { createHealthBar };
