"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface AnalysisResult {
    originalImage: string;
    outlinedImage: string | null;
    dominantColor: string;
    rgbValue: string;
    hexValue: string;
}

export default function ReviewPage() {
    const searchParams = useSearchParams();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        const result = searchParams.get('result');
        if (result) {
            try {
                const data = JSON.parse(decodeURIComponent(result));
                setAnalysis(data);
            } catch (error) {
                console.error('Error parsing result:', error);
            }
        }
    }, [searchParams]);

    if (!analysis) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-black text-xl">Loading analysis...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-center text-black mb-8">
                        Image Analysis Results
                    </h1>

                    {/* Before/After Images */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-black mb-6">Object Detection</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Original Image (Before) */}
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Before</p>
                                <div className="relative aspect-video">
                                    <img
                                        src={analysis.originalImage}
                                        alt="Original"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Outlined Image (After) */}
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">After</p>
                                <div className="relative aspect-video">
                                    {analysis.outlinedImage ? (
                                        <img
                                            src={analysis.outlinedImage}
                                            alt="With Object Detection"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                            <p className="text-gray-500">No clear object detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Color Analysis */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-black mb-6">Color Analysis</h2>

                        <div className="flex items-start space-x-6">
                            {/* Color Preview */}
                            <div
                                className="w-32 h-32 rounded-lg shadow-md flex-shrink-0"
                                style={{ backgroundColor: analysis.hexValue }}
                            />

                            {/* Color Information */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Color Name</p>
                                    <p className="text-lg font-semibold text-black">{analysis.dominantColor}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">RGB Value</p>
                                    <p className="font-mono text-black">{analysis.rgbValue}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Hex Code</p>
                                    <p className="font-mono text-black">{analysis.hexValue}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Analyze Another Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 