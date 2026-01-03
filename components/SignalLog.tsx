"use client";

import React from "react";

interface Signal {
    time: string;
    symbol: string;
    type: "LONG" | "SHORT";
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    status: "CLOSED" | "OPEN";
}

// Manual Trades with User-Defined Prices
const TRADES: Signal[] = [
    // BTC Trades
    {
        time: "12/24 22:00",
        symbol: "BTC",
        type: "LONG",
        entryPrice: 86451.13,
        exitPrice: 89355.76,
        pnl: 3.36,
        status: "CLOSED"
    },
    {
        time: "12/26 23:00",
        symbol: "BTC",
        type: "LONG",
        entryPrice: 86671.08,
        exitPrice: 90125.69,
        pnl: 3.99,
        status: "CLOSED"
    },

    // SOL Trades
    {
        time: "12/24 14:00",
        symbol: "SOL",
        type: "LONG",
        entryPrice: 120.78,
        exitPrice: 129.98,
        pnl: 7.62,
        status: "CLOSED"
    },
    {
        time: "12/26 08:00",
        symbol: "SOL",
        type: "LONG",
        entryPrice: 119.53,
        exitPrice: 129.98,
        pnl: 8.74,
        status: "CLOSED"
    },

    // ETH Trades
    {
        time: "12/26 08:00",
        symbol: "ETH",
        type: "LONG",
        entryPrice: 2897.26,
        exitPrice: 3044.47,
        pnl: 5.08,
        status: "CLOSED"
    },
    {
        time: "12/26 23:00",
        symbol: "ETH",
        type: "LONG",
        entryPrice: 2895.47,
        exitPrice: 3052.64,
        pnl: 5.43,
        status: "CLOSED"
    }
];

interface SignalLogProps {
    selectedCoin: string;
}

export default function SignalLog({ selectedCoin }: SignalLogProps) {

    const displayTrades = TRADES.filter(t => t.symbol === selectedCoin);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📝</span> Veta Signal Log ({selectedCoin}USDT)
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Time</th>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Entry Price</th>
                            <th className="px-4 py-3">Exit Price</th>
                            <th className="px-4 py-3">PNL</th>
                            <th className="px-4 py-3 rounded-r-lg">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayTrades.length > 0 ? (
                            displayTrades.map((signal, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-gray-600 space-nowrap">{signal.time}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{signal.symbol}USDT</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${signal.type === 'LONG'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                            {signal.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-600">${signal.entryPrice.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono text-gray-600">${signal.exitPrice.toFixed(2)}</td>
                                    <td className={`px-4 py-3 font-mono font-bold ${signal.pnl > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {signal.pnl > 0 ? '+' : ''}{signal.pnl.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-2 py-1 rounded">
                                            {signal.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">
                                    No signals recorded for {selectedCoin}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
