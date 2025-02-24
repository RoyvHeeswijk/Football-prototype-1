import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // In een echte implementatie zou je dit uit een database halen
  return NextResponse.json({
    status: 'completed',
    result: 'Your football skills analysis is complete! The most common color in the video is [color]. Analysis of your skills: [detailed feedback]'
  });
} 