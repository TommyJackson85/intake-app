// app/api/debug/supabase/route.ts
export async function GET() {
  return new Response(
    JSON.stringify(
      {
        envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      null,
      2
    ),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
