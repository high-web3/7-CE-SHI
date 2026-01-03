/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, ISeriesApi } from "lightweight-charts";
import { AnalysisResult } from "@/lib/strategy";

interface MainChartProps {
    data: AnalysisResult["kline"][]; // Array of raw candles
    bbData: { time: number; upper: number; middle: number; lower: number; bandwidth?: number }[]; // Pre-calculated BB series
    symbol: string;
    timeframe: string;
    currentPrice?: number;
}

interface Signal {
    time: number;
    price: number;
    type: 'buy' | 'sell';
    id: string;
}

export default function MainChart(props: MainChartProps) {
    const { data, bbData, symbol, timeframe, currentPrice } = props;
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null); // Reference for HTML Overlay

    const [currentCandle, setCurrentCandle] = useState<{ open: number; high: number; low: number; close: number } | null>(null);

    const chartRef = useRef<any>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    // BB Series Refs
    const upperRef = useRef<ISeriesApi<"Line"> | null>(null);
    const middleRef = useRef<ISeriesApi<"Line"> | null>(null);
    const lowerRef = useRef<ISeriesApi<"Line"> | null>(null);

    const liveCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
    const isHoveringRef = useRef<boolean>(false);
    const isInitializedRef = useRef<boolean>(false);

    // STORE SIGNALS REF (To access inside resize/scroll events without re-binding)
    const signalsRef = useRef<Signal[]>([]);

    // CRITICAL: Store timeframe in ref so formatter can always access the latest value
    const timeframeRef = useRef<string>(timeframe);

    const getIntervalSeconds = (tf: string) => {
        const unit = tf.slice(-1);
        const val = parseInt(tf);
        if (unit === 'm') return val * 60;
        if (unit === 'h') return val * 3600;
        if (unit === 'd') return val * 86400;
        if (unit === 'w') return val * 604800;
        return 60; // default 1m
    };

    // >>>>>>>>>>>> HELPER: UPDATE OVERLAY <<<<<<<<<<<<
    const updateOverlay = useCallback(() => {
        if (!chartRef.current || !seriesRef.current || !overlayRef.current) return;

        const chart = chartRef.current;
        const series = seriesRef.current;
        const overlay = overlayRef.current;

        // Calculate Scale based on Zoom Level (Bar Spacing)
        let scale = 1;
        const logicalRange = chart.timeScale().getVisibleLogicalRange();
        if (logicalRange && chartContainerRef.current) {
            const visibleBars = logicalRange.to - logicalRange.from;
            if (visibleBars > 0) {
                const pxPerBar = chartContainerRef.current.clientWidth / visibleBars;
                // If bars are tight (e.g., < 25px), start shrinking
                if (pxPerBar < 25) {
                    scale = Math.max(0.5, pxPerBar / 25);
                }
            }
        }

        // Clear current overlay
        overlay.innerHTML = '';

        // Iterate signals and render visible ones
        signalsRef.current.forEach((signal: Signal) => {
            // Get coordinates
            const x = chart.timeScale().timeToCoordinate(signal.time as any);
            const y = series.priceToCoordinate(signal.price);

            // Check if visible (coordinate is not null)
            if (x !== null && y !== null) {
                const badge = document.createElement('div');

                // Base Styles
                badge.style.position = 'absolute';
                badge.style.left = `${x}px`;
                badge.style.top = `${y}px`;
                // Apply Dynamic Scale
                badge.style.transform = `translate(-50%, -50%) scale(${scale})`;
                badge.style.zIndex = '20';
                badge.style.color = 'white';
                badge.style.borderRadius = '4px';
                badge.style.padding = '2px 6px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                badge.style.lineHeight = '1';
                badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                badge.style.fontFamily = 'sans-serif';
                // Improve rendering transition
                badge.style.transition = 'transform 0.1s ease-out';

                const offsetBasic = 28;
                // Scale the offset slightly too so it doesn't float too far away when shrunk
                const scaledOffset = offsetBasic * Math.max(0.8, scale);

                if (signal.type === 'buy') {
                    // BUY STYLE: TradingView Teal
                    badge.style.backgroundColor = '#26a69a';
                    badge.innerText = 'B';
                    badge.style.top = `${y + scaledOffset}px`; // Shift DOWN

                    // Little Triangle Pointer pointing UP to candle
                    const pointer = document.createElement('div');
                    pointer.style.position = 'absolute';
                    pointer.style.top = '-4px'; // Top of badge
                    pointer.style.left = '50%';
                    pointer.style.transform = 'translateX(-50%)';
                    pointer.style.width = '0';
                    pointer.style.height = '0';
                    pointer.style.borderLeft = '4px solid transparent';
                    pointer.style.borderRight = '4px solid transparent';
                    pointer.style.borderBottom = '4px solid #26a69a';
                    badge.appendChild(pointer);

                } else {
                    // SELL STYLE: TradingView Red
                    badge.style.backgroundColor = '#ef5350';
                    badge.innerText = 'S';
                    badge.style.top = `${y - scaledOffset}px`; // Shift UP

                    // Little Triangle Pointer pointing DOWN to candle
                    const pointer = document.createElement('div');
                    pointer.style.position = 'absolute';
                    pointer.style.bottom = '-4px'; // Bottom of badge
                    pointer.style.left = '50%';
                    pointer.style.transform = 'translateX(-50%)';
                    pointer.style.width = '0';
                    pointer.style.height = '0';
                    pointer.style.borderLeft = '4px solid transparent';
                    pointer.style.borderRight = '4px solid transparent';
                    pointer.style.borderTop = '4px solid #ef5350';
                    badge.appendChild(pointer);
                }

                overlay.appendChild(badge);
            }
        });
    }, []);

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // FORCE CAST OPTIONS TO ANY TO AVOID STRICT TYPE CHECKS ON 'rightPriceScale'
        const chartOptions: any = {
            layout: {
                background: { type: ColorType.Solid, color: "white" },
                textColor: "#333",
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            grid: {
                vertLines: { color: "#f5f5f5" },
                horzLines: { color: "#f5f5f5" },
            },
            // LOCK THE RIGHT PRICE SCALE WIDTH
            // This prevents the chart from "shaking" horizontally when price digits change length
            rightPriceScale: {
                visible: true,
                minimumWidth: 80, // Fixed safe width
                borderColor: '#e1e3eb',
            },
            localization: {
                locale: 'zh-CN',
                timeFormatter: (timestamp: number) => {
                    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
                        timeZone: 'Asia/Shanghai',
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                    });
                }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 70, // INCREASED BACK TO 70 TO ACCOMMODATE LONG LABELS
                tickMarkFormatter: (time: number, tickMarkType: number, locale: string) => {
                    const date = new Date(time * 1000);

                    // CRITICAL FIX: Read from ref to get the LATEST timeframe value
                    // This avoids stale closures that cause flickering
                    const currentTimeframe = timeframeRef.current;
                    const isWeekly = currentTimeframe && currentTimeframe.toLowerCase().includes('w');

                    // 周线模式：无论 tickMarkType 是什么，统一返回完整日期格式
                    // 这确保了所有时间标签长度一致，避免跳动
                    if (isWeekly) {
                        return date.toLocaleDateString('zh-CN', {
                            timeZone: 'Asia/Shanghai',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    }

                    // 非周线模式：使用标准逻辑
                    if (tickMarkType === 0) {
                        return date.toLocaleDateString('zh-CN', {
                            timeZone: 'Asia/Shanghai',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    }
                    if (tickMarkType < 3) {
                        return date.toLocaleDateString('zh-CN', {
                            timeZone: 'Asia/Shanghai',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    }
                    return date.toLocaleTimeString('zh-CN', {
                        timeZone: 'Asia/Shanghai',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
            },
            crosshair: {
                // FORCE: Free Movement (No Magnetic Snapping)
                mode: 0,
                vertLine: { labelVisible: true },
                horzLine: { labelVisible: true },
            },
        };

        const chart = createChart(chartContainerRef.current, chartOptions);

        chartRef.current = chart;

        const candleSeries = chart.addCandlestickSeries({
            upColor: "#00C853",
            downColor: "#FF3D00",
            borderVisible: false,
            wickUpColor: "#00C853",
            wickDownColor: "#FF3D00",
            priceLineColor: "#FFD700",
            crosshairMarkerVisible: false, // FORCE OFF MARKERS ON CANDLES
        });
        seriesRef.current = candleSeries;

        // Bollinger Bands
        const upper = chart.addLineSeries({ color: '#800080', lineWidth: 1, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false });
        const middle = chart.addLineSeries({ color: '#FF6666', lineWidth: 1, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false });
        const lower = chart.addLineSeries({ color: '#0000FF', lineWidth: 1, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false });

        upperRef.current = upper;
        middleRef.current = middle;
        lowerRef.current = lower;

        // Hook into Chart Scroll/Zoom to update Overlay
        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            updateOverlay();
        });

        // Safe param handling with global strictness suppressed
        chart.subscribeCrosshairMove((param: any) => {
            if (param.time) {
                isHoveringRef.current = true;
                const dataPoint = param.seriesData.get(candleSeries) as any;
                if (dataPoint) {
                    setCurrentCandle({
                        open: dataPoint.open,
                        high: dataPoint.high,
                        low: dataPoint.low,
                        close: dataPoint.close,
                    });
                }
            } else {
                isHoveringRef.current = false;
                if (liveCandleRef.current) {
                    setCurrentCandle(liveCandleRef.current);
                }
            }
        });

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                updateOverlay(); // Also update overlay on resize
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
            seriesRef.current = null;
        };
    }, [updateOverlay]);

    // 1.5 Keep timeframeRef in sync with timeframe prop
    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);

    // 2. Load Data
    useEffect(() => {
        if (!seriesRef.current || data.length === 0) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chartData = data.map(d => ({ ...d, time: d.time as any }));
        seriesRef.current.setData(chartData);
        liveCandleRef.current = chartData[chartData.length - 1];
        if (!isHoveringRef.current) setCurrentCandle(chartData[chartData.length - 1]);

        if (!isInitializedRef.current) {
            chartRef.current?.timeScale().fitContent();
            isInitializedRef.current = true;
        }

        // Re-run overlay update after data sort
        setTimeout(updateOverlay, 0);

    }, [data, updateOverlay]);

    // 3. Update BB Data
    useEffect(() => {
        if (!bbData || bbData.length === 0 || !upperRef.current || !middleRef.current || !lowerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upperRef.current.setData(bbData.map(d => ({ time: d.time as any, value: d.upper })));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        middleRef.current.setData(bbData.map(d => ({ time: d.time as any, value: d.middle })));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lowerRef.current.setData(bbData.map(d => ({ time: d.time as any, value: d.lower })));
    }, [bbData]);

    // 4. Real-time Update
    useEffect(() => {
        if (!seriesRef.current || !currentPrice || !liveCandleRef.current) return;
        const intervalSec = getIntervalSeconds(timeframe);
        const nowSec = Math.floor(Date.now() / 1000);
        const currentBarTime = Math.floor(nowSec / intervalSec) * intervalSec;
        let nextCandle: any;
        if (currentBarTime > liveCandleRef.current.time) {
            nextCandle = { time: currentBarTime as any, open: Number(currentPrice), high: Number(currentPrice), low: Number(currentPrice), close: Number(currentPrice) };
        } else {
            const prev = liveCandleRef.current;
            nextCandle = { ...prev, time: prev.time as any, close: Number(currentPrice), high: Math.max(prev.high, Number(currentPrice)), low: Math.min(prev.low, Number(currentPrice)) };
        }
        seriesRef.current.update(nextCandle);
        liveCandleRef.current = nextCandle;
        if (!isHoveringRef.current) setCurrentCandle(nextCandle);
    }, [currentPrice, timeframe]);

    // 5. MANUAL MARKER LOGIC
    useEffect(() => {
        // Clear all signals
        signalsRef.current = [];
        updateOverlay(); // Force clear overlay
    }, [symbol, timeframe, data, updateOverlay]);


    return (
        <div className="w-full h-full p-4 relative">
            {/* Header */}
            <div className="absolute top-4 left-6 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100 shadow-sm flex items-center space-x-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 leading-none">{symbol}USDT</h2>
                    <span className="text-xs font-mono text-gray-500">{timeframe}</span>
                </div>
                {/* OHLC Tooltip */}
                {currentCandle && (
                    <div className="flex space-x-4 text-xs font-mono border-l pl-4 border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">OPEN</span>
                            <span className="font-bold">{currentCandle.open.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">HIGH</span>
                            <span className="font-bold text-green-600">{currentCandle.high.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">LOW</span>
                            <span className="font-bold text-red-500">{currentCandle.low.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px]">CLOSE</span>
                            <span className="font-bold">{currentCandle.close.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col min-w-[60px]">
                            <span className="text-gray-400 text-[10px]">CHANGE</span>
                            <span className={`font-bold ${((currentCandle.close - currentCandle.open) >= 0) ? 'text-green-600' : 'text-red-500'}`}>
                                {((currentCandle.close - currentCandle.open) / currentCandle.open * 100).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* CHART WRAPPER */}
            <div className="relative w-full h-full">
                {/* HTML OVERLAY LAYER */}
                <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
                    {/* Markers will be injected here via updateOverlay() */}
                </div>

                {/* Lightweight Chart Container */}
                <div key="chart-v3" ref={chartContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
}
