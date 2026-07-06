import { NextResponse } from 'next/server';

export default function BackendIndexPage() {
  return NextResponse.redirect(new URL('/api/health', process.env.NEXT_PUBLIC_API_BASE_URL ?? '/'));
}
