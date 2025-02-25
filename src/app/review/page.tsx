"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewPage() {
    const [imageData, setImageData] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const savedData = localStorage.getItem('imageAnalysis');
        if (savedData) {
            const data = JSON.parse(savedData);
            setImageData(data.image);
            setAnalysis(data.analysis);
            localStorage.removeItem('imageAnalysis');
        }
    }, []);

    if (!imageData || !analysis) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">No analysis available</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Image Analysis</h1>
                
                {/* Image */}
                <div className="mb-6">
                    <img 
                        src={imageData} 
                        alt="Analyzed" 
                        className="w-full rounded-lg"
                    />
                </div>

                {/* Analysis Results */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Detected Objects</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        {analysis.split('\n').map((item, index) => (
                            <div key={index} className="mb-2 text-lg">
                                • {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                    >
                        Analyze Another Image
                    </button>
                </div>
            </div>
        </div>
    );
} 