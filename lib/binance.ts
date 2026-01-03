import axios from 'axios';

// Binance Public API Base URL
const BASE_URL = 'https://api.binance.com/api/v3';

export type Kline = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

// Map our app's timeframe keys to Binance API intervals
export const INTERVALS = {
    '1m': '1m',
    '5m': '5m',
    '30m': '30m',
    '1h': '1h',
    '2h': '2h',
    '4h': '4h',
    '8h': '8h',
    '12h': '12h',
    '1d': '1d',
    '1w': '1w',
};

export const SUPPORTED_COINS = ['BTC', 'ETH', 'SOL', 'LTC', 'DOGE', 'ZEC', 'BNB'];

/**
 * Fetch K-Line data (Candlesticks)
 */
export async function fetchKlines(symbol: string, interval: string, limit: number = 100): Promise<Kline[]> {
    try {
        const response = await axios.get(`${BASE_URL}/klines`, {
            params: {
                symbol: `${symbol.toUpperCase()}USDT`,
                interval: interval,
                limit: limit,
            },
        });

        // Binance returns array of arrays: [time, open, high, low, close, volume, ...]
        // We map it to a stricter object format
        return response.data.map((d: any) => ({
            time: d[0] / 1000, // Lightweight charts uses seconds for unix timestamp
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
        }));
    } catch (error) {
        console.error(`Error fetching klines for ${symbol} ${interval}:`, error);
        return [];
    }
}

/**
 * fetchTicker (existing)
 */
export async function fetchTicker(symbol: string): Promise<number> {
    try {
        const response = await axios.get(`${BASE_URL}/ticker/price`, {
            params: { symbol: `${symbol.toUpperCase()}USDT` }
        });
        return parseFloat(response.data.price);
    } catch (error) {
        console.error(`Error fetching ticker for ${symbol}:`, error);
        return 0;
    }
}

/**
 * Fetch Funding Rate (Futures API)
 */
export async function fetchFundingRate(symbol: string): Promise<string> {
    try {
        const response = await axios.get(`https://fapi.binance.com/fapi/v1/premiumIndex`, {
            params: { symbol: `${symbol.toUpperCase()}USDT` }
        });
        const rate = parseFloat(response.data.lastFundingRate);
        return (rate * 100).toFixed(4) + '%';
    } catch (error) {
        console.warn(`Error fetching funding rate for ${symbol}:`, error);
        return "0.0100%";
    }
}

/**
 * Fetch 24h Ticker Stats
 */
export async function fetch24hStats(symbol: string): Promise<number> {
    try {
        const response = await axios.get(`${BASE_URL}/ticker/24hr`, {
            params: { symbol: `${symbol.toUpperCase()}USDT` }
        });
        return parseFloat(response.data.priceChangePercent);
    } catch (error) {
        console.warn(`Error fetching 24h stats for ${symbol}:`, error);
        return 0;
    }
}
