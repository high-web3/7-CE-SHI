"use client";
// VETA 7.1 FIX DROPDOWN - TIMESTAMP_1767103000

import React, { useEffect, useState, useCallback, useRef } from "react";
import CoinSelector from "@/components/CoinSelector";
import TimeframeCard from "@/components/TimeframeCard";
import MainChart from "@/components/MainChart";
import SignalLog from "@/components/SignalLog";
import { fetchKlines, fetchTicker, fetchFundingRate, fetch24hStats, INTERVALS, Kline } from "@/lib/binance";
import { calculateBollingerBands, calculateBollingerBandsSeries, AnalysisResult } from "@/lib/strategy";

export default function Home() {
    const [selectedCoin, setSelectedCoin] = useState("BTC");
    const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
    const [tickerPrice, setTickerPrice] = useState<number>(0);
    const [fundingRate, setFundingRate] = useState("0.0100%");
    const [ticker24hChange, setTicker24hChange] = useState<number>(0);

    // Data for all timeframes (for the cards)
    const [analytics, setAnalytics] = useState<Record<string, AnalysisResult | null>>({});

    // Data for the main chart
    const [chartData, setChartData] = useState<Kline[]>([]);
    const [chartBB, setChartBB] = useState<any[]>([]);

    // Ref to track latest processed time to avoid redundant updates
    const lastChartTimeRef = useRef<number>(0);

    // 1. Fetch Ticker (1s)
    useEffect(() => {
        const getTicker = async () => {
            try {
                const [price, rate, change24h] = await Promise.all([
                    fetchTicker(selectedCoin),
                    fetchFundingRate(selectedCoin),
                    fetch24hStats(selectedCoin)
                ]);
                setTickerPrice(price);
                setFundingRate(rate);
                setTicker24hChange(change24h);
            } catch (e) {
                console.error("Ticker fetch error", e);
            }
        };
        getTicker();
        const interval = setInterval(getTicker, 1000);
        return () => clearInterval(interval);
    }, [selectedCoin]);

    // 2. Fetch Analytics (5s)
    const refreshAnalytics = useCallback(async () => {
        const results: Record<string, AnalysisResult | null> = {};
        await Promise.all(
            Object.entries(INTERVALS).map(async ([label, apiInterval]) => {
                const klines = await fetchKlines(selectedCoin, apiInterval, 50);
                const bb = calculateBollingerBands(klines);
                if (bb && klines.length > 0) {
                    results[label] = {
                        timeframe: label,
                        close: klines[klines.length - 1].close,
                        bands: bb,
                        kline: klines[klines.length - 1]
                    };
                } else {
                    results[label] = null;
                }
            })
        );
        setAnalytics(results);
    }, [selectedCoin]);

    useEffect(() => {
        refreshAnalytics();
        const interval = setInterval(refreshAnalytics, 5000);
        return () => clearInterval(interval);
    }, [refreshAnalytics]);

    // 3. Fetch Main Chart (2s Polling)
    useEffect(() => {
        const loadChart = async () => {
            const apiInterval = INTERVALS[selectedTimeframe as keyof typeof INTERVALS];
            const klines = await fetchKlines(selectedCoin, apiInterval, 500);

            if (klines.length > 0) {
                const latestTime = klines[klines.length - 1].time;
                setChartData(klines);
                setChartBB(calculateBollingerBandsSeries(klines));
                lastChartTimeRef.current = latestTime;
            }
        };
        loadChart();
        const interval = setInterval(loadChart, 2000);
        return () => clearInterval(interval);
    }, [selectedCoin, selectedTimeframe]);


    return (
        <div className="min-h-screen p-4 max-w-[1600px] mx-auto space-y-4 font-sans text-gray-900">
            {/* HEADER - REMOVED overflow-hidden from Header to allow Dropdown */}
            {/* Added relative z-50 to ensure it sits on top if needed */}
            <header className="relative grid grid-cols-3 items-center bg-white shadow-sm rounded-2xl border border-gray-100 px-6 py-1 min-h-[90px] z-50">

                {/* LEFT COL: Logo (Massive Scale) */}
                {/* Apply overflow-hidden HERE locally to clip the massive logo inside the rounded corner area if needed */}
                {/* But technically 'rounded-2xl' on parent wont clip children if parent is visible. */}
                {/* We use a wrapper to clip the logo strictly to the left column area so it doesn't bleed weirdly */}
                <div className="flex justify-start h-full items-center overflow-hidden rounded-l-2xl absolute left-0 top-0 bottom-0 w-1/3">
                    <div className="pl-6 h-full flex items-center">
                        {/* Increased Scale to 3.0 */}
                        <div className="transform scale-[3.0] origin-left">
                            <img src="/veta-brand-white.png" alt="Veta Logo" className="h-[70px] w-auto object-contain" />
                        </div>
                    </div>
                </div>
                {/* Spacer div to keep grid layout integrity since the real logo is absolute now */}
                <div className="flex justify-start"></div>


                {/* CENTER COL: Price (Strictly Centered) */}
                <div className="flex flex-col items-center justify-center z-10 pl-12 md:pl-0">
                    <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Current Price</div>
                    <div className="flex items-center justify-center">
                        {/* Orange Price - Reduced to text-lg on mobile (was 3xl) */}
                        <span className="text-lg md:text-6xl font-mono font-bold text-orange-500 tracking-tighter">
                            ${tickerPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {/* 24h Change */}
                        <span className={`ml-2 md:ml-4 text-xs md:text-xl font-bold ${ticker24hChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {ticker24hChange >= 0 ? '▲' : '▼'} {Math.abs(ticker24hChange).toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* RIGHT COL: Controls (Right Aligned) */}
                <div className="flex justify-end pr-6 z-10">
                    <div className="flex flex-col items-end space-y-2 border-l-2 border-gray-100 pl-8 py-1">
                        {/* Funding Rate */}
                        <div className="flex flex-col items-end w-full">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Funding Rate</span>
                            <span className="text-base font-mono font-medium text-gray-700">{fundingRate}</span>
                        </div>
                        {/* Coin Selector */}
                        <div>
                            <CoinSelector selectedCoin={selectedCoin} onSelect={setSelectedCoin} />
                        </div>
                    </div>
                </div>

            </header>

            {/* TOP SECTION: CHART */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 z-0" >
                <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-1 overflow-hidden">
                    <MainChart
                        symbol={selectedCoin}
                        timeframe={selectedTimeframe}
                        data={chartData}
                        bbData={chartBB}
                        currentPrice={tickerPrice}
                    />
                </div>
            </div >

            {/* STRATEGY DASHBOARD */}
            <div className="space-y-4" >
                <div className="flex items-center space-x-2 px-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase">Multi-Timeframe Analysis</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {Object.keys(INTERVALS).map((tf) => (
                        <TimeframeCard
                            key={tf}
                            timeframe={tf}
                            data={analytics[tf]}
                            isSelected={selectedTimeframe === tf}
                            onClick={() => setSelectedTimeframe(tf)}
                        />
                    ))}
                </div>
            </div >

            {/* BOTTOM SECTION: SIGNALS */}
            <SignalLog selectedCoin={selectedCoin} />
        </div>
    );
}
