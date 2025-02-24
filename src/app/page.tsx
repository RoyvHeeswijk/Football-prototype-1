"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const router = useRouter();

  const analyzeVideo = async (videoBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', videoBlob);

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();

      if (data.status === 'success') {
        // Create object URL for video
        const videoUrl = URL.createObjectURL(videoBlob);
        // Navigate to review page with results
        router.push(`/review?video=${encodeURIComponent(videoUrl)}&result=${encodeURIComponent(JSON.stringify(data.result))}`);
      } else {
        throw new Error('Analysis failed');
      }

    } catch (error) {
      console.error('Error analyzing video:', error);
      alert('Er ging iets mis bij het analyseren van de video. Probeer het opnieuw.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-[#002020] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 pb-16 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 row-start-2 items-center w-full max-w-lg px-4">
        <h1 className="text-2xl font-bold">Camera</h1>
        <h2>Deze video is lit</h2>
        <video
          id="videoElement"
          className="w-full rounded-lg scale-x-[-1]"
          autoPlay
          playsInline
          muted
        ></video>

        <div className="w-full">
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              className="rounded-full bg-foreground text-background px-4 py-2 text-sm"
              onClick={async () => {
                const video = document.getElementById('videoElement') as HTMLVideoElement;
                try {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');

                    if (videoDevices.length === 0) {
                      throw new Error('No video devices found');
                    }


                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                      }
                    });

                    video.srcObject = stream;
                    (window as any).currentStream = stream;
                  }
                } catch (err) {
                  console.error("Error accessing camera:", err);
                  alert('Failed to access camera. Please ensure you have granted camera permissions.');
                }
              }}
            >
              Start Camera
            </button>

            <button
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm"
              onClick={() => {
                const video = document.getElementById('videoElement') as HTMLVideoElement;
                const stream = video.srcObject as MediaStream;
                if (stream) {
                  const tracks = stream.getTracks();
                  tracks.forEach(track => track.stop());
                  video.srcObject = null;
                  (window as any).currentStream = null;
                  const mediaRecorder = (window as any).currentRecorder;
                  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                  }
                }
              }}
            >
              Stop Camera
            </button>

            <button
              id="startRecording"
              className="rounded-full bg-red-500 text-white px-4 py-2 text-sm"
              onClick={async () => {
                try {
                  const stream = (window as any).currentStream;
                  if (!stream) {
                    alert('Please start the camera first');
                    return;
                  }


                  const mimeTypes = [
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm',
                    'video/mp4'
                  ];

                  let selectedMimeType = '';
                  for (const mimeType of mimeTypes) {
                    if (MediaRecorder.isTypeSupported(mimeType)) {
                      selectedMimeType = mimeType;
                      break;
                    }
                  }

                  if (!selectedMimeType) {
                    throw new Error('No supported video MIME type found');
                  }

                  const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: selectedMimeType
                  });

                  const chunks: BlobPart[] = [];

                  mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                      chunks.push(e.data);
                    }
                  };

                  mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: selectedMimeType });

                    try {
                      const formData = new FormData();
                      formData.append('file', blob);

                      const response = await fetch('/api/analyze-video', {
                        method: 'POST',
                        body: formData,
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to analyze video');
                      }

                      const data = await response.json();

                      if (data.status === 'success') {
                        // Create object URL for video
                        const videoUrl = URL.createObjectURL(blob);
                        // Navigate to review page with results
                        router.push(`/review?video=${encodeURIComponent(videoUrl)}&result=${encodeURIComponent(JSON.stringify(data.result))}`);
                      } else {
                        throw new Error('Analysis failed');
                      }

                    } catch (error) {
                      console.error('Error analyzing video:', error);
                      alert('Er ging iets mis bij het analyseren van de video. Probeer het opnieuw.');
                    }

                    // Behoud de bestaande downloadButton logica
                    const downloadButton = document.getElementById('downloadVideo');
                    if (downloadButton) {
                      downloadButton.style.display = 'block';
                      (window as any).recordedBlob = blob;
                    }
                  };

                  mediaRecorder.start(1000);
                  (window as any).currentRecorder = mediaRecorder;

                  const startButton = document.getElementById('startRecording');
                  const stopButton = document.getElementById('stopRecording');
                  if (startButton) startButton.style.display = 'none';
                  if (stopButton) stopButton.style.display = 'block';
                } catch (err) {
                  console.error('Error starting recording:', err);
                  alert('Failed to start recording. Please try again.');
                }
              }}
            >
              Opnemen
            </button>

            <button
              id="stopRecording"
              className="rounded-full border border-solid border-red-500 text-red-500 px-4 py-2 text-sm"
              style={{ display: 'none' }}
              onClick={() => {
                const mediaRecorder = (window as any).currentRecorder;
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                  mediaRecorder.stop();
                  (window as any).currentRecorder = null;

                  const startButton = document.getElementById('startRecording');
                  const stopButton = document.getElementById('stopRecording');
                  if (startButton) startButton.style.display = 'block';
                  if (stopButton) stopButton.style.display = 'none';
                }
              }}
            >
              Stop Recording
            </button>

            <button
              id="downloadVideo"
              className="rounded-full bg-green-500 text-white px-4 py-2 text-sm"
              style={{ display: 'none' }}
              onClick={async () => {
                try {
                  const blob = (window as any).recordedBlob;
                  if (blob) {
                    const file = new File([blob], `recorded-video-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`, {
                      type: blob.type
                    });

                    if (navigator.share && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({
                          files: [file],
                          title: 'Recorded Video',
                        });
                      } catch (err) {
                        console.error('Error sharing:', err);

                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        URL.revokeObjectURL(url);
                      }
                    } else {

                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = file.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }
                } catch (err) {
                  console.error('Error handling video:', err);
                  alert('Failed to share/download video. Please try again.');
                }
              }}
            >
              Doorsturen
            </button>
          </div>
        </div>
      </main>

      <footer className="row-start-3 text-center text-xs px-4">
        <p>Je moet ervoor zorgen dat je de Camera aanzet om te gebruiken.</p>
      </footer>

      {isAnalyzing && <div className="loader">Analyzing video...</div>}
      {analysisResult && <div className="analysis-result">{analysisResult}</div>}
    </div>
  );
}
