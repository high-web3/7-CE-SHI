"use client";

import React, { useState, useRef, useEffect } from "react";
import { SUPPORTED_COINS } from "@/lib/binance";

interface CoinSelectorProps {
    selectedCoin: string;
    onSelect: (coin: string) => void;
}

export default function CoinSelector({ selectedCoin, onSelect }: CoinSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (coin: string) => {
        onSelect(coin);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all font-medium min-w-[140px] justify-between cursor-pointer"
            >
                <div className="flex items-center space-x-2 pointer-events-none">
                    <img
                        src={`https://assets.coincap.io/assets/icons/${selectedCoin.toLowerCase()}@2x.png`}
                        alt={selectedCoin}
                        className="w-5 h-5 rounded-full"
                        onError={(e: any) => (e.currentTarget.style.display = 'none')}
                    />
                    <span>{selectedCoin}USDT</span>
                </div>
                {/* Custom SVG Chevron */}
                <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                    <div className="py-1">
                        {SUPPORTED_COINS.map((coin) => (
                            <button
                                key={coin}
                                onClick={() => handleSelect(coin)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${selectedCoin === coin ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
                            >
                                <img
                                    src={`https://assets.coincap.io/assets/icons/${coin.toLowerCase()}@2x.png`}
                                    alt={coin}
                                    className="w-5 h-5 rounded-full"
                                    onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                />
                                <span className="font-medium">{coin}USDT</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
