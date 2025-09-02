# Import Users Edge Function

This Edge Function allows bulk import of users with authentication account creation.

## Deployment

1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref [your-project-ref]
```

4. Deploy the function:
```bash
supabase functions deploy import-users
```

## Usage

The function accepts POST requests with:
- `users`: Array of user objects
- `createAuth`: Boolean to create auth accounts

## Security

- Requires authentication token
- Only admins can use this function
- Uses service role key internally (secure)