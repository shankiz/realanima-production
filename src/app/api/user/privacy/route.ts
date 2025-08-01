
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Privacy settings API',
    endpoints: {
      'DELETE /delete-history': 'Delete all conversation history'
    }
  });
}
