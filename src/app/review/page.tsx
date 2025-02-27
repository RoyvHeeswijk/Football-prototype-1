"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AnalysisResult {
    originalImage: string;
    dominantColor: string;
    rgbValue: string;
    hexValue: string;
}

export default function ReviewPage() {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);
    const [pixelData, setPixelData] = useState<string[][]>([]);
    const [objectDetection, setObjectDetection] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const PIXEL_SIZE = 10; // Grootte van elke "pixel" in het raster
    const router = useRouter();

    useEffect(() => {
        const savedData = localStorage.getItem('imageAnalysis');
        if (savedData) {
            const data = JSON.parse(savedData);
            setAnalysis(data);
            localStorage.removeItem('imageAnalysis');

            // Laad de afbeelding en maak het pixelraster
            const img = new Image();
            img.onload = () => createPixelGrid(img);
            img.src = data.originalImage;
        }
    }, []);

    const createPixelGrid = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Stel canvas grootte in
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const gridData: string[][] = [];

        // Sample pixels met intervals
        for (let y = 0; y < canvas.height; y += PIXEL_SIZE) {
            const row: string[] = [];
            for (let x = 0; x < canvas.width; x += PIXEL_SIZE) {
                try {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
                    row.push(hex);
                } catch (e) {
                    console.error('Error sampling pixel:', e);
                    row.push('#000000');
                }
            }
            gridData.push(row);
        }

        setPixelData(gridData);
    };

    const rgbToHex = (r: number, g: number, b: number): string => {
        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const detectObject = async () => {
        if (!analysis || isDetecting) return;
        
        setIsDetecting(true);
        
        try {
            const response = await fetch('/api/predict-objects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    dominantColor: analysis.dominantColor,
                    rgbValue: analysis.rgbValue,
                    hexValue: analysis.hexValue
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to predict objects');
            }
            
            const data = await response.json();
            setObjectDetection(data.prediction);
        } catch (error) {
            console.error('Error:', error);
            setObjectDetection('Failed to predict objects based on color analysis.');
        } finally {
            setIsDetecting(false);
        }
    };

    if (!analysis) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading analysis...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                    Color Analysis Results
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Original Image with Pixel Grid */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">Original Image</h2>
                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                            {/* Original Image */}
                            <img
                                src={analysis.originalImage}
                                alt="Original"
                                className="w-full h-auto"
                            />

                            {/* Pixel Grid Overlay */}
                            <div className="absolute inset-0 grid"
                                style={{
                                    gridTemplateColumns: `repeat(${pixelData[0]?.length || 0}, ${PIXEL_SIZE}px)`,
                                    gridTemplateRows: `repeat(${pixelData.length || 0}, ${PIXEL_SIZE}px)`
                                }}>
                                {pixelData.flat().map((color, index) => (
                                    <div
                                        key={index}
                                        className="hover:bg-opacity-50 transition-all duration-150 cursor-crosshair"
                                        style={{ backgroundColor: color }}
                                        onMouseEnter={() => setHoveredColor(color)}
                                        onMouseLeave={() => setHoveredColor(null)}
                                    />
                                ))}
                            </div>

                            {/* Hover Info */}
                            {hoveredColor && (
                                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg font-mono flex items-center space-x-2">
                                    <span>{hoveredColor}</span>
                                    <div
                                        className="w-6 h-6 rounded"
                                        style={{ backgroundColor: hoveredColor }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Color Analysis */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-700">Color Information</h2>

                        {/* Dominant Color Display */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Dominant Color</label>
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-16 h-16 rounded-lg shadow-md relative group cursor-pointer"
                                        style={{ backgroundColor: analysis.hexValue }}
                                    >
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-300 flex items-center justify-center">
                                            <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">
                                                {analysis.hexValue}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-medium text-gray-800">
                                        {analysis.dominantColor}
                                    </span>
                                </div>
                            </div>

                            {/* Color Values */}
                            <div className="space-y-4 mt-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">RGB Value</label>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-gray-700">
                                        {analysis.rgbValue}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Hex Value</label>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-gray-700">
                                        {analysis.hexValue}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-gray-700 mb-4">Color Preview</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div
                                    className="aspect-square rounded-lg shadow-md relative group cursor-pointer"
                                    style={{ backgroundColor: analysis.hexValue }}
                                >
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-300 flex items-center justify-center">
                                        <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">
                                            {analysis.hexValue}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="aspect-square rounded-lg shadow-md relative group cursor-pointer"
                                    style={{ backgroundColor: analysis.hexValue, opacity: 0.7 }}
                                >
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-300 flex items-center justify-center">
                                        <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">
                                            {analysis.hexValue} 70%
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="aspect-square rounded-lg shadow-md relative group cursor-pointer"
                                    style={{ backgroundColor: analysis.hexValue, opacity: 0.4 }}
                                >
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-300 flex items-center justify-center">
                                        <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">
                                            {analysis.hexValue} 40%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Object Detection Section */}
                    <div className="md:col-span-2 mt-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">Object Detection</h2>
                                <button
                                    onClick={detectObject}
                                    disabled={isDetecting}
                                    className={`px-4 py-2 rounded-lg text-white ${
                                        isDetecting ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                                    } transition-colors`}
                                >
                                    {isDetecting ? 'Detecting...' : 'Detect Objects'}
                                </button>
                            </div>
                            
                            <div className="bg-white rounded-lg p-5 shadow-inner min-h-[100px] flex items-center justify-center">
                                {objectDetection ? (
                                    <div className="text-gray-800">{objectDetection}</div>
                                ) : (
                                    <div className="text-gray-500">
                                        Click "Detect Objects" to analyze what's in this image
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center space-x-4">
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl shadow-md transition-colors duration-200 flex items-center space-x-2"
                    >
                        <span>Analyze Another Image</span>
                    </button>
                </div>
            </div>
        </div>
    );
} 