"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnalysisResult {
    originalImage: string;
    dominantColor: string;
    rgbValue: string;
    hexValue: string;
}

interface ShapeAnalysis {
    description: string;
    aspectRatio: number;
    complexity: number;
    hasHoles: boolean;
    edgeCount: number;
    symmetry: string;
    distribution: string;
}

export default function ReviewPage() {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);
    const [pixelData, setPixelData] = useState<string[][]>([]);
    const [centerColors, setCenterColors] = useState<string[]>([]);
    const [shapeAnalysis, setShapeAnalysis] = useState<ShapeAnalysis | null>(null);
    const [objectDetection, setObjectDetection] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const PIXEL_SIZE = 10; // Grootte van elke "pixel" in het raster
    const router = useRouter();

    useEffect(() => {
        const savedData = localStorage.getItem('imageAnalysis');
        if (savedData) {
            const data = JSON.parse(savedData);
            setAnalysis(data);
            localStorage.removeItem('imageAnalysis');

            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                createPixelGrid(img);
                extractCenterColors(img);
                performDetailedShapeAnalysis(img);
            };
            img.src = data.originalImage;
        }
    }, []);

    const performDetailedShapeAnalysis = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
            // Stap 1: Maak een binaire afbeelding (voorgrond/achtergrond)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const binaryMap: boolean[][] = [];

            // Bereken de gemiddelde kleur voor thresholding
            let totalR = 0, totalG = 0, totalB = 0;
            for (let i = 0; i < data.length; i += 4) {
                totalR += data[i];
                totalG += data[i + 1];
                totalB += data[i + 2];
            }

            const pixelCount = data.length / 4;
            const avgR = totalR / pixelCount;
            const avgG = totalG / pixelCount;
            const avgB = totalB / pixelCount;

            // Maak een binaire kaart (true = voorgrond, false = achtergrond)
            for (let y = 0; y < canvas.height; y++) {
                const row: boolean[] = [];
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];

                    // Bereken de afstand tot de gemiddelde kleur
                    const distance = Math.sqrt(
                        Math.pow(r - avgR, 2) +
                        Math.pow(g - avgG, 2) +
                        Math.pow(b - avgB, 2)
                    );

                    // Bepaal of dit een voorgrond- of achtergrondpixel is
                    const threshold = 30;
                    row.push(distance > threshold);
                }
                binaryMap.push(row);
            }

            // Stap 2: Analyseer de vorm
            const aspectRatio = canvas.width / canvas.height;

            // Tel het aantal voorgrondpixels
            let foregroundCount = 0;
            for (let y = 0; y < binaryMap.length; y++) {
                for (let x = 0; x < binaryMap[y].length; x++) {
                    if (binaryMap[y][x]) foregroundCount++;
                }
            }

            const foregroundRatio = foregroundCount / (canvas.width * canvas.height);

            // Stap 3: Detecteer gaten
            const hasHoles = detectHoles(binaryMap);

            // Stap 4: Analyseer randen
            const edgeCount = countEdges(binaryMap);

            // Stap 5: Controleer symmetrie
            const symmetry = checkSymmetry(binaryMap);

            // Stap 6: Analyseer kleurverdeling
            const distribution = analyzeDistribution(binaryMap);

            // Stap 7: Bereken complexiteit
            const complexity = calculateComplexity(binaryMap);

            // Genereer een gedetailleerde beschrijving
            let description = "";

            // Vorm op basis van aspect ratio
            if (Math.abs(aspectRatio - 1) < 0.2) {
                description += "Square or circular shape";
            } else if (aspectRatio > 1.5) {
                description += "Wide rectangular or horizontal shape";
            } else if (aspectRatio < 0.7) {
                description += "Tall rectangular or vertical shape";
            } else {
                description += "Roughly rectangular shape";
            }

            // Voeg informatie over gaten toe
            description += hasHoles ? " with holes or empty spaces" : " without holes";

            // Voeg informatie over randen toe
            if (edgeCount > 100) {
                description += ", highly detailed edges";
            } else if (edgeCount > 50) {
                description += ", moderately detailed edges";
            } else {
                description += ", simple edges";
            }

            // Voeg informatie over symmetrie toe
            description += `, ${symmetry} symmetry`;

            // Voeg informatie over verdeling toe
            description += `, ${distribution}`;

            // Voeg informatie over complexiteit toe
            if (complexity > 0.7) {
                description += ", very complex pattern";
            } else if (complexity > 0.4) {
                description += ", moderately complex pattern";
            } else {
                description += ", simple pattern";
            }

            // Voeg informatie over grootte toe
            if (foregroundRatio < 0.3) {
                description += ", small relative to frame";
            } else if (foregroundRatio > 0.7) {
                description += ", large filling most of the frame";
            } else {
                description += ", medium sized";
            }

            setShapeAnalysis({
                description,
                aspectRatio,
                complexity,
                hasHoles,
                edgeCount,
                symmetry,
                distribution
            });

        } catch (e) {
            console.error('Error in shape analysis:', e);
            setShapeAnalysis({
                description: "Failed to analyze shape",
                aspectRatio: 1,
                complexity: 0,
                hasHoles: false,
                edgeCount: 0,
                symmetry: "unknown",
                distribution: "unknown"
            });
        }
    };

    // Functie om gaten te detecteren
    const detectHoles = (binaryMap: boolean[][]): boolean => {
        // Eenvoudige implementatie: zoek naar achtergrondpixels die volledig omringd zijn door voorgrondpixels
        let holesFound = false;

        for (let y = 1; y < binaryMap.length - 1; y++) {
            for (let x = 1; x < binaryMap[y].length - 1; x++) {
                // Als dit een achtergrondpixel is
                if (!binaryMap[y][x]) {
                    // Controleer of alle buren voorgrondpixels zijn
                    const allNeighborsForeground =
                        binaryMap[y - 1][x - 1] && binaryMap[y - 1][x] && binaryMap[y - 1][x + 1] &&
                        binaryMap[y][x - 1] && binaryMap[y][x + 1] &&
                        binaryMap[y + 1][x - 1] && binaryMap[y + 1][x] && binaryMap[y + 1][x + 1];

                    if (allNeighborsForeground) {
                        holesFound = true;
                        break;
                    }
                }
            }
            if (holesFound) break;
        }

        return holesFound;
    };

    // Functie om randen te tellen
    const countEdges = (binaryMap: boolean[][]): number => {
        let edgeCount = 0;

        for (let y = 1; y < binaryMap.length - 1; y++) {
            for (let x = 1; x < binaryMap[y].length - 1; x++) {
                // Als dit een voorgrondpixel is
                if (binaryMap[y][x]) {
                    // Controleer of het een randpixel is (heeft minstens één achtergrondpixel als buur)
                    const hasBackgroundNeighbor =
                        !binaryMap[y - 1][x - 1] || !binaryMap[y - 1][x] || !binaryMap[y - 1][x + 1] ||
                        !binaryMap[y][x - 1] || !binaryMap[y][x + 1] ||
                        !binaryMap[y + 1][x - 1] || !binaryMap[y + 1][x] || !binaryMap[y + 1][x + 1];

                    if (hasBackgroundNeighbor) {
                        edgeCount++;
                    }
                }
            }
        }

        return edgeCount;
    };

    // Functie om symmetrie te controleren
    const checkSymmetry = (binaryMap: boolean[][]): string => {
        const height = binaryMap.length;
        const width = binaryMap[0].length;

        // Horizontale symmetrie
        let horizontalSymmetry = true;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                if (binaryMap[y][x] !== binaryMap[y][width - 1 - x]) {
                    horizontalSymmetry = false;
                    break;
                }
            }
            if (!horizontalSymmetry) break;
        }

        // Verticale symmetrie
        let verticalSymmetry = true;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height / 2; y++) {
                if (binaryMap[y][x] !== binaryMap[height - 1 - y][x]) {
                    verticalSymmetry = false;
                    break;
                }
            }
            if (!verticalSymmetry) break;
        }

        if (horizontalSymmetry && verticalSymmetry) {
            return "both horizontal and vertical";
        } else if (horizontalSymmetry) {
            return "horizontal";
        } else if (verticalSymmetry) {
            return "vertical";
        } else {
            return "no";
        }
    };

    // Functie om kleurverdeling te analyseren
    const analyzeDistribution = (binaryMap: boolean[][]): string => {
        const height = binaryMap.length;
        const width = binaryMap[0].length;

        // Tel voorgrondpixels in elke regio
        let topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0;
        const halfWidth = Math.floor(width / 2);
        const halfHeight = Math.floor(height / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (binaryMap[y][x]) {
                    if (y < halfHeight) {
                        if (x < halfWidth) topLeft++;
                        else topRight++;
                    } else {
                        if (x < halfWidth) bottomLeft++;
                        else bottomRight++;
                    }
                }
            }
        }

        const total = topLeft + topRight + bottomLeft + bottomRight;
        const threshold = 0.3; // 30% verschil

        // Controleer of de verdeling uniform is
        const isUniform =
            Math.abs(topLeft / total - 0.25) < threshold &&
            Math.abs(topRight / total - 0.25) < threshold &&
            Math.abs(bottomLeft / total - 0.25) < threshold &&
            Math.abs(bottomRight / total - 0.25) < threshold;

        if (isUniform) {
            return "evenly distributed";
        }

        // Controleer of de verdeling geconcentreerd is in één regio
        const max = Math.max(topLeft, topRight, bottomLeft, bottomRight);
        if (max === topLeft && topLeft / total > 0.5) {
            return "concentrated in top-left";
        } else if (max === topRight && topRight / total > 0.5) {
            return "concentrated in top-right";
        } else if (max === bottomLeft && bottomLeft / total > 0.5) {
            return "concentrated in bottom-left";
        } else if (max === bottomRight && bottomRight / total > 0.5) {
            return "concentrated in bottom-right";
        }

        // Controleer of de verdeling geconcentreerd is in de bovenste helft
        const topHalf = topLeft + topRight;
        const bottomHalf = bottomLeft + bottomRight;
        if (topHalf / total > 0.7) {
            return "concentrated in top half";
        } else if (bottomHalf / total > 0.7) {
            return "concentrated in bottom half";
        }

        // Controleer of de verdeling geconcentreerd is in de linker helft
        const leftHalf = topLeft + bottomLeft;
        const rightHalf = topRight + bottomRight;
        if (leftHalf / total > 0.7) {
            return "concentrated in left half";
        } else if (rightHalf / total > 0.7) {
            return "concentrated in right half";
        }

        return "irregularly distributed";
    };

    // Functie om complexiteit te berekenen
    const calculateComplexity = (binaryMap: boolean[][]): number => {
        const height = binaryMap.length;
        const width = binaryMap[0].length;

        // Tel het aantal overgangen van voorgrond naar achtergrond en vice versa
        let transitions = 0;

        // Horizontale overgangen
        for (let y = 0; y < height; y++) {
            for (let x = 1; x < width; x++) {
                if (binaryMap[y][x] !== binaryMap[y][x - 1]) {
                    transitions++;
                }
            }
        }

        // Verticale overgangen
        for (let x = 0; x < width; x++) {
            for (let y = 1; y < height; y++) {
                if (binaryMap[y][x] !== binaryMap[y - 1][x]) {
                    transitions++;
                }
            }
        }

        // Normaliseer de complexiteit tussen 0 en 1
        const maxPossibleTransitions = 2 * width * height;
        return transitions / maxPossibleTransitions;
    };

    const extractCenterColors = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Bepaal het centrum van de afbeelding
        const centerX = Math.floor(img.width / 2);
        const centerY = Math.floor(img.height / 2);

        // Neem een gebied van 3x3 samples rond het centrum
        const sampleSize = Math.floor(img.width / 10); // 10% van de breedte
        const colors: string[] = [];

        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                const sampleX = centerX + (x * sampleSize);
                const sampleY = centerY + (y * sampleSize);

                // Zorg ervoor dat we binnen de afbeelding blijven
                if (sampleX >= 0 && sampleX < img.width && sampleY >= 0 && sampleY < img.height) {
                    try {
                        const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
                        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
                        colors.push(hex);
                    } catch (e) {
                        console.error('Error sampling center pixel:', e);
                    }
                }
            }
        }

        // Verwijder duplicaten
        const uniqueColors = [...new Set(colors)];
        setCenterColors(uniqueColors.slice(0, 5)); // Maximaal 5 kleuren
    };

    const createPixelGrid = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const gridData: string[][] = [];

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
        if (isDetecting) return;

        setIsDetecting(true);

        try {
            // Zorg ervoor dat we altijd minstens één kleur hebben
            const colorsToSend = centerColors.length > 0 ? centerColors : ['#FFFFFF'];

            const response = await fetch('/api/predict-objects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    centerColors: colorsToSend,
                    shape: shapeAnalysis ? shapeAnalysis.description : 'unknown shape',
                    shapeDetails: shapeAnalysis ? {
                        aspectRatio: shapeAnalysis.aspectRatio,
                        hasHoles: shapeAnalysis.hasHoles,
                        edgeCount: shapeAnalysis.edgeCount,
                        symmetry: shapeAnalysis.symmetry,
                        distribution: shapeAnalysis.distribution,
                        complexity: shapeAnalysis.complexity
                    } : null
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to predict objects');
            }

            const data = await response.json();
            setObjectDetection(data.prediction);
        } catch (error) {
            console.error('Error:', error);
            setObjectDetection('Failed to predict objects based on analysis.');
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

                    {/* Object Prediction Section */}
                    <div className="md:col-span-2 mt-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">Object Prediction</h2>
                                <button
                                    onClick={detectObject}
                                    disabled={isDetecting}
                                    className={`px-4 py-2 rounded-lg text-white ${isDetecting ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                                        } transition-colors`}
                                >
                                    {isDetecting ? 'Analyzing...' : 'Predict Objects'}
                                </button>
                            </div>

                            <div className="bg-white rounded-lg p-5 shadow-inner min-h-[120px]">
                                {objectDetection ? (
                                    <div className="text-gray-800">
                                        <h3 className="font-medium mb-2">Possible objects in this image:</h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {objectDetection.split(',').map((item, index) => (
                                                <li key={index} className="text-gray-700">{item.trim()}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center flex items-center justify-center h-full">
                                        Click "Predict Objects" to analyze the image
                                    </div>
                                )}
                            </div>

                            {/* Analysis Info */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Center Colors Display */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Colors Used for Analysis:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {centerColors.length > 0 ? (
                                            centerColors.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-8 h-8 rounded-md shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-gray-500 text-sm">No center colors detected</div>
                                        )}
                                    </div>
                                </div>

                                {/* Shape Info */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Shape Analysis:</h3>
                                    <div className="text-gray-700 text-sm">
                                        {shapeAnalysis ? shapeAnalysis.description : 'Analyzing shape...'}
                                    </div>
                                </div>
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