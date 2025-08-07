import { NextRequest, NextResponse } from 'next/server';
import { ImageRetrievalAgent } from '@/app/lib/imageRetrievalAgent';

export async function POST(request: NextRequest) {
  try {
    const { blogContent, topic, query } = await request.json();

    if (!blogContent && !query) {
      return NextResponse.json(
        { error: 'Either blogContent and topic, or query is required' },
        { status: 400 }
      );
    }

    const imageAgent = new ImageRetrievalAgent();

    let images;
    let summary;

    if (query) {
      // Search for specific images by query
      images = await imageAgent.searchImagesByQuery(query);
      summary = {
        query,
        totalImagesFound: images.length,
        type: 'manual_search'
      };
    } else {
      // Find relevant images for blog content
      if (!topic) {
        return NextResponse.json(
          { error: 'Topic is required when providing blogContent' },
          { status: 400 }
        );
      }

      images = await imageAgent.findRelevantImages(blogContent, topic);
      summary = await imageAgent.getImageSearchSummary(blogContent, topic);
    }

    return NextResponse.json({
      images,
      summary,
      count: images.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const imageAgent = new ImageRetrievalAgent();
    const images = await imageAgent.searchImagesByQuery(query);

    return NextResponse.json({
      images,
      query,
      count: images.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
