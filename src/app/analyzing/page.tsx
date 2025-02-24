"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyzingPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/check-analysis-status');
      const data = await response.json();
      
      if (data.status === 'completed') {
        setAnalysis(data.result);
        clearInterval(interval);
        setTimeout(() => {
          router.push('/?result=' + encodeURIComponent(data.result));
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <div>
        <h1>Analyzing Your Football Skills</h1>
        <p>Please wait while AI analyzes your video...</p>
        {analysis && (
          <div>
            <p>Analysis complete! Redirecting...</p>
          </div>
        )}
      </div>
    </main>
  );
} 