"use client";

import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Camera Access</h1>
        
        <video 
          id="videoElement"
          className="w-full max-w-lg rounded-lg"
          autoPlay
          playsInline
        ></video>

        <div className="flex gap-4 flex-wrap">
          <button
            className="rounded-full bg-foreground text-background px-6 py-2"
            onClick={() => {
              const video = document.getElementById('videoElement') as HTMLVideoElement;
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.enumerateDevices()
                  .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    if (videoDevices.length > 0) {
                      return navigator.mediaDevices.getUserMedia({ 
                        video: {
                          deviceId: videoDevices[0].deviceId,
                          facingMode: "user",
                          width: { ideal: 1280 },
                          height: { ideal: 720 }
                        }
                      });
                    } else {
                      throw new Error('No video devices found');
                    }
                  })
                  .then((stream) => {
                    video.srcObject = stream;
                    (window as any).currentStream = stream;
                  })
                  .catch((err) => {
                    console.error("Error accessing camera:", err);
                  });
              }
            }}
          >
            Start Camera
          </button>

          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-6 py-2"
            onClick={() => {
              const video = document.getElementById('videoElement') as HTMLVideoElement;
              const stream = video.srcObject as MediaStream;
              if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
                (window as any).currentStream = null;
                // Also stop recording if it's ongoing
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
            className="rounded-full bg-red-500 text-white px-6 py-2"
            onClick={() => {
              const stream = (window as any).currentStream;
              if (stream) {
                const mediaRecorder = new MediaRecorder(stream, {
                  mimeType: 'video/webm;codecs=vp9'
                });
                const chunks: BlobPart[] = [];
                
                mediaRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) {
                    chunks.push(e.data);
                  }
                };

                mediaRecorder.onstop = () => {
                  const blob = new Blob(chunks, { type: 'video/webm' });
                  const downloadButton = document.getElementById('downloadVideo');
                  if (downloadButton) {
                    downloadButton.style.display = 'block';
                    (window as any).recordedBlob = blob;
                  }
                };

                // Record in 1-second chunks
                mediaRecorder.start(1000);
                (window as any).currentRecorder = mediaRecorder;
                
                // Update UI
                const startButton = document.getElementById('startRecording');
                const stopButton = document.getElementById('stopRecording');
                if (startButton) startButton.style.display = 'none';
                if (stopButton) stopButton.style.display = 'block';
              }
            }}
          >
            Start Recording
          </button>

          <button
            id="stopRecording"
            className="rounded-full border border-solid border-red-500 text-red-500 px-6 py-2"
            style={{ display: 'none' }}
            onClick={() => {
              const mediaRecorder = (window as any).currentRecorder;
              if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                (window as any).currentRecorder = null;
                
                // Update UI
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
            className="rounded-full bg-green-500 text-white px-6 py-2"
            style={{ display: 'none' }}
            onClick={() => {
              const blob = (window as any).recordedBlob;
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                a.href = url;
                a.download = `recorded-video-${timestamp}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
          >
            Download Recording
          </button>
        </div>
      </main>

      <footer className="row-start-3 text-center text-sm">
        <p>Allow camera access when prompted to use this feature</p>
      </footer>
    </div>
  );
}
