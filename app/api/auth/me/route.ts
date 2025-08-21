import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import sql from '@/lib/db';
import { User } from '@/utils/types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Please add it to your .env.local file.');
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET!) as any;

    // Get user from database
    const users = await sql<User[]>`
      SELECT id, name, email, profile_image FROM users WHERE id = ${decoded.id}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    return NextResponse.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
