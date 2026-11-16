import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#E50914"/>
  <text x="16" y="22" font-size="18" font-family="Arial,sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle">M</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}
