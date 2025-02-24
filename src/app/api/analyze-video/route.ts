import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug log voor API key
console.log('API Key aanwezig:', !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeImage(base64Image: string) {
    try {
        console.log('Starting image analysis...');
        const analysis = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a color analysis expert. Your task is to identify colors in the described scene. Respond ONLY with the most dominant color name, nothing else."
                },
                {
                    role: "user",
                    content: "I have a video frame. Please identify the most dominant color in it. Just respond with the color name."
                }
            ],
            max_tokens: 50
        });
        console.log('Analysis completed:', analysis.choices[0].message.content);
        return {
            status: 'success',
            result: {
                dominantColor: analysis.choices[0].message.content?.trim()
            }
        };
    } catch (error) {
        console.error('Detailed error in AI analysis:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        console.log('Received POST request');
        const data = await req.formData();
        const file = data.get('file') as File;

        if (!file) {
            console.log('No file provided');
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        console.log('File received, size:', file.size);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Voor nu geven we een standaard kleuranalyse terug
        return NextResponse.json({
            status: 'success',
            result: {
                dominantColor: 'Gray' // Standaard kleur als placeholder
            }
        });

    } catch (error) {
        console.error('Detailed API route error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : 'No stack trace'
            },
            { status: 500 }
        );
    }
} 