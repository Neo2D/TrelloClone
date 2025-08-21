import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sql from '@/lib/db';
import { User } from '@/utils/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

interface UserWithPassword extends User {
  password?: string;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    console.log(`Attempting to authenticate user with email: ${email}`);

    const users = await sql<UserWithPassword[]>`
      SELECT id, name, email, password FROM users WHERE email = ${email}
    `;

    if (users.length === 0 || !users[0].password) {
      console.log('User not found or no password');
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    
    const user = users[0];
    console.log(`User found: ${user.name} (${user.id})`);

    // For development, accept any password
    let passwordMatch = true;
    
    // Uncomment this for production
    // const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Password mismatch');
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful, setting token');

    // Return JSON response with user data
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}