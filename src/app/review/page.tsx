"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface ColorAnalysis {
  dominantColor?: string;
  description?: string;
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ColorAnalysis>({});

  useEffect(() => {
    const videoData = searchParams.get('video');
    const analysisData = searchParams.get('result');
    
    if (videoData) {
      setVideoUrl(decodeURIComponent(videoData));
    }
    if (analysisData) {
      const analysisText = decodeURIComponent(analysisData);
      // Parse the analysis text to extract color and description
      const colorMatch = analysisText.match(/Dominant color: (.*?)(?:\n|$)/);
      const dominantColor = colorMatch ? colorMatch[1] : '';
      const description = analysisText.split('\n').slice(1).join('\n').trim();
      
      setAnalysis({
        dominantColor,
        description
      });
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Color Analysis</h1>
      
      {videoUrl && (
        <div className="mb-6">
          <video 
            controls 
            className="w-full max-w-2xl mx-auto"
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {analysis.dominantColor && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Color Analysis</h2>
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <p className="text-lg font-medium">Dominant Color:</p>
              <div 
                className="w-32 h-32 rounded-lg shadow-md mt-2"
                style={{ 
                  backgroundColor: analysis.dominantColor.toLowerCase(),
                  border: '1px solid #ccc'
                }}
              />
              <p className="mt-2 text-lg">{analysis.dominantColor}</p>
            </div>
            {analysis.description && (
              <div className="mt-4">
                <p className="text-gray-700">{analysis.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!videoUrl && !analysis.dominantColor && (
        <div className="text-center text-gray-600">
          No video or analysis data available.
        </div>
      )}
    </div>
  );
} 