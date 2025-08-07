import { NextRequest, NextResponse } from 'next/server';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const {
      workspaceId,
      draftContent,
      draftMetadata = {},
      isPublic = false,
      collaborators = []
    } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing required field: workspaceId' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    const workspaceIdResult = await userSessionService.saveWorkspaceState(
      userId,
      workspaceId,
      draftContent,
      draftMetadata,
      isPublic,
      collaborators
    );

    const response = NextResponse.json({ 
      message: 'Workspace state saved successfully',
      workspace_id: workspaceIdResult 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error saving workspace state:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to save workspace state' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    if (workspaceId) {
      // Get specific workspace
      const workspace = await userSessionService.getWorkspaceState(userId, workspaceId);
      
      if (!workspace) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }

      const response = NextResponse.json({ workspace });
      return addCorsHeaders(response, request);
    } else {
      // Get all user workspaces
      const workspaces = await userSessionService.getUserWorkspaces(userId);
      
      const response = NextResponse.json({ workspaces });
      return addCorsHeaders(response, request);
    }
  } catch (error) {
    console.error('Error fetching workspace state:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch workspace state' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function DELETE(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing required parameter: workspaceId' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    await userSessionService.deleteWorkspaceState(userId, workspaceId);

    const response = NextResponse.json({ 
      message: 'Workspace deleted successfully' 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error deleting workspace state:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete workspace state' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
