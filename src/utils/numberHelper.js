/**
 * Parses numeric strings with units like k, m, b
 * @param {string|number} input - string like "10k", "1.5m", "1b"
 * @returns {number} - integer value
 */
function parseAmount(input) {
    if (typeof input === 'number') return input;
    if (!input || typeof input !== 'string') return 0;
    
    const units = {
        'k': 1000,
        'm': 1000000,
        'b': 1000000000
    };
    
    // Normalize input (remove spaces, lowercase)
    const normalized = input.toLowerCase().replace(/\s/g, '');
    
    const match = normalized.match(/^([\d.]+)([kmb])?$/);
    if (!match) {
        const val = parseInt(normalized);
        return isNaN(val) ? 0 : val;
    }
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    if (unit && units[unit]) {
        return Math.floor(value * units[unit]);
    }
    
    return Math.floor(value);
}

module.exports = { parseAmount };
