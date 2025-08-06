# Google Sign-In with Supabase Implementation Guide

This document outlines how to implement user authentication via Google Sign-In using Supabase for the frontend application.

## 1. Google Sign-In Flow with Supabase

The process is streamlined by Supabase's built-in OAuth support.

1.  **User Interface (UI):**
    *   The sign-in process begins when a user clicks the "Sign in with Google" button located in the `app/components/SignUpModal.tsx` component.

2.  **Authentication Trigger:**
    *   The `onClick` handler of the button calls the `supabase.auth.signInWithOAuth()` function, specifying `'google'` as the provider. This function handles the entire OAuth 2.0 flow.

3.  **Supabase Handling:**
    *   Supabase redirects the user to Google's authentication page.
    *   After the user approves, Google redirects back to a callback URL managed by Supabase.
    *   Supabase automatically verifies the user's details and, if the user is new, creates a record in the `auth.users` table.
    *   Finally, the user is redirected back to your application, now in a logged-in state.

## 2. Obtaining Google API Credentials

To use Google Sign-In, you first need to obtain API credentials (a client ID and client secret) from the Google API Console.

1.  **Go to the Google API Console:**
    *   Navigate to the [Google API Console](https://console.developers.google.com/apis/credentials).

2.  **Create or Select a Project:**
    *   If you don't have a project already, create a new one.

3.  **Configure the OAuth Consent Screen:**
    *   Go to the "OAuth consent screen" tab.
    *   Choose "External" for the user type.
    *   Fill in the required information (app name, user support email, etc.).
    *   In the "Scopes" section, you can leave it empty.
    *   Add test users if your app is in testing mode.

4.  **Create OAuth Client ID Credentials:**
    *   Go to the "Credentials" tab.
    *   Click on "+ CREATE CREDENTIALS" and select "OAuth client ID".
    *   For "Application type", select "Web application".
    *   Give it a name.

5.  **Set Authorized URIs:**
    *   **Authorized JavaScript origins**: This is where your app is running. For local development, add `http://localhost:3000`.
    *   **Authorized redirect URIs**: This is the most critical step. You need to get this URL from your Supabase dashboard. Go to **Authentication** -> **Providers** -> **Google**. You will find your unique "Redirect URL" there. It will look something like `https://<your-project-ref>.supabase.co/auth/v1/callback`. Copy this URL and paste it here.

6.  **Get Client ID and Client Secret:**
    *   After clicking "Create", a dialog will appear with your "Client ID" and "Client Secret".
    *   Copy these values.

## 3. Configure Supabase

1.  **Navigate to Supabase Dashboard:**
    *   Go to your project's dashboard on [supabase.com](https://supabase.com/).
2.  **Go to Google Provider Settings:**
    *   In the left sidebar, go to **Authentication** -> **Providers**.
    *   Find **Google** in the list and enable it.
3.  **Enter Your Google Credentials:**
    *   Paste the "Client ID" and "Client Secret" you obtained from the Google API Console into the respective fields.
    *   Click "Save".

Your application is now fully configured for Google Sign-In. There is no need to store the Google credentials in your Next.js app's environment variables; Supabase handles them securely. 