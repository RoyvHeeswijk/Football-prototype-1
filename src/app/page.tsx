"use client";

export default function Home() {
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
          muted // Added muted attribute for mobile autoplay
        ></video>

        <div className="w-full">
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              className="rounded-full bg-foreground text-background px-4 py-2 text-sm"
              onClick={async () => { // Made async to use try-catch
                const video = document.getElementById('videoElement') as HTMLVideoElement;
                try {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    
                    if (videoDevices.length === 0) {
                      throw new Error('No video devices found');
                    }

                    // Try to use the front camera on mobile
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
              onClick={async () => { // Made async for better error handling
                try {
                  const stream = (window as any).currentStream;
                  if (!stream) {
                    alert('Please start the camera first');
                    return;
                  }

                  // Check for supported MIME types
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

                  mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: selectedMimeType });
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
              onClick={() => {
                try {
                  const blob = (window as any).recordedBlob;
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    a.href = url;
                    a.download = `recorded-video-${timestamp}.webm`;
                    
                    // For mobile devices, open in new tab if download doesn't work
                    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                      window.open(url, '_blank');
                    } else {
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                    
                    URL.revokeObjectURL(url);
                  }
                } catch (err) {
                  console.error('Error downloading video:', err);
                  alert('Failed to download video. Please try again.');
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
    </div>
  );
}
