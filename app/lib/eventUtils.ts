import { supabase } from './supabaseClient';

interface LogEventParams {
  name: string;
  category?: string;
  user_id?: string;
  is_error?: boolean;
  error_message?: string;
  is_dev?: boolean;
}

export async function logEvent({
  name,
  category,
  user_id,
  is_error = false,
  error_message,
}: LogEventParams) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    // Get current user if no user_id provided
    const { data: { session } } = await supabase.auth.getSession();
    const final_user_id = session?.user?.id || user_id;

    // If still no user_id, don't proceed
    if (!final_user_id) {
      console.error('No user ID provided or available for event logging');
      return null;
    }

    // Call the API route to log the event
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        category,
        user_id: final_user_id,
        is_error,
        error_message,
        is_dev: isDev
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to log event:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error in logEvent:', error);
    return null;
  }
}

// Example usage:
/*
await logEvent({
  name: 'resume_generation_started',
  category: 'resume',
});

await logEvent({
  name: 'api_error',
  category: 'error',
  is_error: true,
  error_message: 'Failed to connect to API',
});

await logEvent({
  name: 'dev_test',
  category: 'test',
  is_dev: true,
});
*/ 