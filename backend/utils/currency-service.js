const axios = require('axios');

/**
 * Currency Service
 * Handles fetching live exchange rates
 */

// Fallback rates (Hardcoded as of Feb 2026)
const FALLBACK_RATES = {
    'EGP_TO_AED': 0.075,
    'AED_TO_EGP': 13.33
};

/**
 * Get exchange rate from one currency to another
 * @param {string} from - Source currency (e.g., 'EGP')
 * @param {string} to - Target currency (e.g., 'AED')
 * @returns {Promise<number>} - The exchange rate
 */
const getExchangeRate = async (from, to) => {
    try {
        // To prevent drift, we always fetch AED as base and derive EGP or vice versa
        // We'll use AED as the primary benchmark for EGP/AED pairs
        const base = (from === 'AED' || to === 'AED') ? 'AED' : from;
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`);

        if (response.data && response.data.rates) {
            const rates = response.data.rates;

            if (base === from) {
                // Direct rate: e.g. from AED to EGP
                if (rates[to]) return rates[to];
            } else {
                // Inverse rate: e.g. from EGP to AED
                if (rates[from]) return 1 / rates[from];
            }
        }

        throw new Error(`Rate conversion between ${from} and ${to} failed`);
    } catch (err) {
        console.error('Currency Service Error:', err.message);

        // Return fallback if API fails
        const key = `${from}_TO_${to}`;
        if (FALLBACK_RATES[key]) {
            return FALLBACK_RATES[key];
        }

        return 1;
    }
};

module.exports = {
    getExchangeRate
};
