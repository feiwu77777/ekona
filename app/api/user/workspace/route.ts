import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
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

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
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
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
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

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
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
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
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

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    await userSessionService.deleteWorkspaceState(userId, workspaceId);

    const response = NextResponse.json({ 
      message: 'Workspace deleted successfully' 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error deleting workspace state:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete workspace state' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
