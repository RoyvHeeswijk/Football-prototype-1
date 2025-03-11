import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { centerColors, shape, shapeDetails } = await req.json();
    
    if (!centerColors || centerColors.length === 0) {
      return NextResponse.json({ error: 'No color data provided' }, { status: 400 });
    }

    // Bouw een gedetailleerde beschrijving op basis van de vormgegevens
    let shapeDescription = shape || "unknown shape";
    
    if (shapeDetails) {
      shapeDescription += `. Additional details: aspect ratio ${shapeDetails.aspectRatio.toFixed(2)}, `;
      shapeDescription += shapeDetails.hasHoles ? "contains holes, " : "no holes, ";
      shapeDescription += `${shapeDetails.edgeCount} edge pixels, `;
      shapeDescription += `${shapeDetails.symmetry} symmetry, `;
      shapeDescription += `${shapeDetails.distribution}, `;
      shapeDescription += `complexity level ${(shapeDetails.complexity * 100).toFixed(0)}%.`;
    }

    // Gebruik OpenAI om objecten te voorspellen op basis van kleur en vorm
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a computer vision expert. Respond with exactly 5 objects that might be in an image based on the colors and detailed shape analysis, separated by commas. No explanations, just the list of 5 objects."
        },
        {
          role: "user",
          content: `Based on these detailed image properties, list exactly 5 objects that might be in the image:
          
          Center Colors: ${centerColors.join(', ')}
          Shape Analysis: ${shapeDescription}
          
          Respond with only 5 objects separated by commas. No explanations or additional text.`
        }
      ],
      max_tokens: 50
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