import { NextRequest, NextResponse } from 'next/server';
import { ReferenceManagementAgent } from '@/app/lib/referenceManagementAgent';

const referenceAgent = new ReferenceManagementAgent();

export async function POST(request: NextRequest) {
  try {
    const { researchData, blogContent } = await request.json();

    if (!researchData || !Array.isArray(researchData)) {
      return NextResponse.json(
        { error: 'Missing or invalid researchData array' },
        { status: 400 }
      );
    }

    if (!blogContent || typeof blogContent !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid blogContent' },
        { status: 400 }
      );
    }

    // Extract references from research data
    const referenceList = await referenceAgent.extractReferences(researchData, blogContent);
    
    // Generate markdown references
    const markdownReferences = referenceAgent.generateMarkdownReferences(referenceList.references);
    
    // Embed references in blog content
    const blogWithReferences = await referenceAgent.embedReferencesInBlog(blogContent, referenceList.references);
    
    // Validate references
    const validation = referenceAgent.validateReferences(referenceList.references);
    
    // Get reference summary
    const summary = await referenceAgent.getReferenceSummary(researchData);

    return NextResponse.json({
      references: referenceList.references,
      markdownReferences,
      blogWithReferences,
      summary,
      validation,
      metadata: {
        totalReferences: referenceList.totalCount,
        generatedAt: referenceList.generatedAt
      }
    });

  } catch (error) {
    console.error('Reference management error:', error);
    return NextResponse.json(
      { error: 'Failed to process references' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const researchDataParam = searchParams.get('researchData');
    const blogContentParam = searchParams.get('blogContent');

    if (!researchDataParam || !blogContentParam) {
      return NextResponse.json(
        { error: 'Missing researchData or blogContent parameters' },
        { status: 400 }
      );
    }

    let researchData: any[];
    let blogContent: string;

    try {
      researchData = JSON.parse(decodeURIComponent(researchDataParam));
      blogContent = decodeURIComponent(blogContentParam);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in parameters' },
        { status: 400 }
      );
    }

    // Extract references from research data
    const referenceList = await referenceAgent.extractReferences(researchData, blogContent);
    
    // Get reference summary
    const summary = await referenceAgent.getReferenceSummary(researchData);
    
    // Validate references
    const validation = referenceAgent.validateReferences(referenceList.references);

    return NextResponse.json({
      references: referenceList.references,
      summary,
      validation,
      metadata: {
        totalReferences: referenceList.totalCount,
        generatedAt: referenceList.generatedAt
      }
    });

  } catch (error) {
    console.error('Reference management error:', error);
    return NextResponse.json(
      { error: 'Failed to process references' },
      { status: 500 }
    );
  }
}
