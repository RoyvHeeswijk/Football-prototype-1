import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function getMainColors(buffer: Buffer) {
    try {
        const { dominant } = await sharp(buffer).stats();

        const r = dominant.r;
        const g = dominant.g;
        const b = dominant.b;
        const hexColor = rgbToHex(r, g, b);

        return {
            rgb: `RGB(${r},${g},${b})`,
            hex: hexColor
        };
    } catch (error) {
        console.error('Error analyzing colors:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file = data.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Get color values
        const colorData = await getMainColors(buffer);

        // Use GPT-3.5-turbo to name the color
        const analysis = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a color expert. Given RGB values, provide the most accurate color name. Be specific and only respond with the color name, nothing else."
                },
                {
                    role: "user",
                    content: `What is the most accurate name for this color: ${colorData.rgb}?`
                }
            ],
            max_tokens: 50
        });

        // Convert to base64 for display
        const base64Image = buffer.toString('base64');

        return NextResponse.json({
            originalImage: `data:image/${file.type};base64,${base64Image}`,
            dominantColor: analysis.choices[0].message.content?.trim(),
            rgbValue: colorData.rgb,
            hexValue: colorData.hex
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze image' },
            { status: 500 }
        );
    }
}