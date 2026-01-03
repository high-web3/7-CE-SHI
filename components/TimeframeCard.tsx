"use client";

import React from "react";
import { AnalysisResult } from "@/lib/strategy";
import { cn } from "@/lib/utils";

interface TimeframeCardProps {
    timeframe: string;
    data: AnalysisResult | null;
    isSelected?: boolean;
    onClick?: () => void;
}

export default function TimeframeCard({ timeframe, data, isSelected, onClick }: TimeframeCardProps) {
    if (!data) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-32 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between">
                    <div className="h-4 w-8 bg-gray-100 rounded"></div>
                    <div className="h-4 w-12 bg-gray-100 rounded"></div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded mt-4"></div>
            </div>
        );
    }

    const { bands, kline } = data;
    const { percentB, bandwidth, squeeze } = bands;
    const isHigh = percentB > 1.0;
    const isLow = percentB < 0.0;

    // Determine bar color
    let barColor = "bg-blue-500";
    let textColor = "text-gray-900";

    if (isHigh) {
        barColor = "bg-red-500";
        textColor = "text-red-600";
    } else if (isLow) {
        barColor = "bg-green-500"; // Assuming green for oversold/dip buy op
        // Note: Reference image shows red for high %B.
        // It implies: Overbought -> Red, Normal -> Blue.
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md select-none",
                isSelected ? "border-teal-500 ring-1 ring-teal-500" : "border-gray-200"
            )}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-700 text-sm">{timeframe}</span>
                {squeeze && (
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        Squeeze
                    </span>
                )}
            </div>

            {/* %B Value */}
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-gray-400 font-medium">%B</span>
                <span className={cn("font-bold text-sm", textColor)}>
                    {percentB.toFixed(2)}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.min(Math.max(percentB * 100, 0), 100)}%` }}
                ></div>
            </div>

            {/* High / Low Prices */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500">
                    <span className="text-red-400 font-bold">H</span>
                    <span className="font-mono">{bands.upper.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                    <span className="text-green-400 font-bold">L</span>
                    <span className="font-mono">{bands.lower.toFixed(2)}</span>
                </div>
            </div>

            {/* Bandwidth */}
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">Width</span>
                <span className="text-[10px] text-gray-400 font-mono">{(bandwidth * 100).toFixed(1)}%</span>
            </div>
        </div>
    );
}
