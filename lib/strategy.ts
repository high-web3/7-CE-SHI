// Pure JS Bollinger Bands Calculation to remove dependencies

export interface AnalysisResult {
    timeframe: string;
    close: number;
    bands: {
        upper: number;
        middle: number;
        lower: number;
        percentB: number;
        bandwidth: number;
        squeeze: boolean;
    };
    kline: any;
}

export type Kline = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

// Helper: Standard Deviation
function getStandardDeviation(array: number[], mean: number): number {
    const n = array.length;
    if (n === 0) return 0;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

// Helper: SMA
function getSMA(array: number[]): number {
    const n = array.length;
    if (n === 0) return 0;
    return array.reduce((a, b) => a + b) / n;
}

// Main Function: Calculate Last Candle BB
export function calculateBollingerBands(klines: Kline[], period: number = 20, stdDev: number = 2) {
    if (klines.length < period) return null;

    // Use only the close prices
    const closePrices = klines.map(k => k.close);

    // Slice the last 'period' candles
    const window = closePrices.slice(-period);

    const middle = getSMA(window);
    const sd = getStandardDeviation(window, middle);

    const upper = middle + (stdDev * sd);
    const lower = middle - (stdDev * sd);

    // Derived metrics
    const bandwidth = middle !== 0 ? (upper - lower) / middle : 0;
    const percentB = (upper - lower) !== 0 ? (window[window.length - 1] - lower) / (upper - lower) : 0;
    const squeeze = bandwidth < 0.10; // Threshold for squeeze

    return {
        upper,
        middle,
        lower,
        percentB,
        bandwidth,
        squeeze
    };
}

// Series Function: Calculate BB for ALL historical points (for Chart)
export function calculateBollingerBandsSeries(klines: Kline[], period: number = 20, stdDev: number = 2) {
    if (klines.length < period) return [];

    const results = [];
    const closePrices = klines.map(k => k.close);

    // We can compute for every point starting from index 'period - 1'
    for (let i = period - 1; i < klines.length; i++) {
        // Window of prices ending at i, size 'period'
        const window = closePrices.slice(i - period + 1, i + 1);

        const middle = getSMA(window);
        const sd = getStandardDeviation(window, middle);

        const upper = middle + (stdDev * sd);
        const lower = middle - (stdDev * sd);

        // Calculate Bandwidth for Strategy Filtering
        const bandwidth = middle !== 0 ? (upper - lower) / middle : 0;
        const squeeze = bandwidth < 0.05; // Tighter definition for "Squeeze" in series

        results.push({
            time: klines[i].time,
            upper,
            middle,
            lower,
            bandwidth, // Exported for Chart logic
            squeeze
        });
    }

    return results;
}

// NEW: Calculate RSI Series (Pure JS)
export function calculateRSI(klines: Kline[], period: number = 14) {
    if (klines.length < period + 1) return [];

    const results = [];
    const closes = klines.map(k => k.close);

    // Calculate initial average gain/loss
    let gain = 0;
    let loss = 0;

    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gain += change;
        else loss -= change;
    }

    let avgGain = gain / period;
    let avgLoss = loss / period;

    // First RSI value at index 'period'
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss; // Avoid div by zero
    let rsi = 100 - (100 / (1 + rs));

    results.push({ time: klines[period].time, value: rsi });

    // Wilder's Smoothing for subsequent values
    for (let i = period + 1; i < klines.length; i++) {
        const change = closes[i] - closes[i - 1];
        let currentGain = 0;
        let currentLoss = 0;

        if (change > 0) currentGain = change;
        else currentLoss = -change;

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

        if (avgLoss === 0) {
            rsi = 100;
        } else {
            rs = avgGain / avgLoss;
            rsi = 100 - (100 / (1 + rs));
        }

        results.push({ time: klines[i].time, value: rsi });
    }

    return results;
}
