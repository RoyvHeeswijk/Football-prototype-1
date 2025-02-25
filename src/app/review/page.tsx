"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnalysisResult {
    originalImage: string;
    dominantColor: string;
    rgbValue: string;
    hexValue: string;
}

export default function ReviewPage() {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const router = useRouter();

    useEffect(() => {
        const savedData = localStorage.getItem('imageAnalysis');
        if (savedData) {
            const data = JSON.parse(savedData);
            setAnalysis(data);
            localStorage.removeItem('imageAnalysis');
        }
    }, []);

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
                    {/* Original Image */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">Original Image</h2>
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <img 
                                src={analysis.originalImage} 
                                alt="Analyzed" 
                                className="w-full h-auto"
                            />
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
                                        className="w-16 h-16 rounded-lg shadow-md" 
                                        style={{ backgroundColor: analysis.hexValue }}
                                    />
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
                                    className="aspect-square rounded-lg shadow-md" 
                                    style={{ backgroundColor: analysis.hexValue }}
                                />
                                <div 
                                    className="aspect-square rounded-lg shadow-md" 
                                    style={{ backgroundColor: analysis.hexValue, opacity: 0.7 }}
                                />
                                <div 
                                    className="aspect-square rounded-lg shadow-md" 
                                    style={{ backgroundColor: analysis.hexValue, opacity: 0.4 }}
                                />
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