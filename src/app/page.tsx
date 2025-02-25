"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze image');

      const data = await response.json();
      localStorage.setItem('imageAnalysis', JSON.stringify(data));
      router.push('/review');
    } catch (error) {
      console.error('Error:', error);
      alert('Error analyzing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-black mb-8">
            Color Analyzer
          </h1>

          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-6">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Upload Section */}
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Upload Image'}
              </button>
              <p className="mt-4 text-gray-600 text-sm">
                Upload an image to analyze its dominant color
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
