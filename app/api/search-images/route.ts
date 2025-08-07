import { NextRequest, NextResponse } from 'next/server';
import { ImageRetrievalAgent } from '@/app/lib/imageRetrievalAgent';

const imageAgent = new ImageRetrievalAgent();

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Search for images using the query
    const images = await imageAgent.searchImagesByQuery(query);

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Search for images using the query
    const images = await imageAgent.searchImagesByQuery(query);

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
