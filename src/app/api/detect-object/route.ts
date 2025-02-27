import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Gebruik OpenAI Vision API om objecten te detecteren
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an image analysis expert. Identify the main objects in the image and describe them briefly. Focus on the most prominent objects."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What objects do you see in this image? List the main objects only." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 150
    });

    return NextResponse.json({
      detection: response.choices[0].message.content
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to detect objects' },
      { status: 500 }
    );
  }
} 