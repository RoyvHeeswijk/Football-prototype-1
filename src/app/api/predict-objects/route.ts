import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { dominantColor, rgbValue, hexValue } = await req.json();
    
    if (!dominantColor) {
      return NextResponse.json({ error: 'No color data provided' }, { status: 400 });
    }

    // Gebruik OpenAI om objecten te voorspellen op basis van kleur
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a color analysis expert who can predict what objects might be in an image based on color information."
        },
        {
          role: "user",
          content: `Based on the following color information from an image, suggest 3-5 objects that might be in the image:
          
          Dominant Color: ${dominantColor}
          RGB Value: ${rgbValue}
          Hex Value: ${hexValue}
          
          Please provide a brief explanation of why these objects might be present based on the color.`
        }
      ],
      max_tokens: 200
    });

    return NextResponse.json({
      prediction: response.choices[0].message.content
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to predict objects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 