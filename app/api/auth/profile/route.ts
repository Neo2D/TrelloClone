import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import sql from '@/lib/db';
import bcrypt from 'bcrypt';

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    
    const [userProfile] = await sql`
      SELECT id, name, email, profile_image FROM users WHERE id = ${user.id}
    `;
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    if ((error as Error).message === 'Unauthenticated') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { name, email, currentPassword, newPassword } = await req.json();
    
    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if email is already taken by another user
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email} AND id != ${user.id}
    `;
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
    }
    
    // If password change is requested, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      
      // Verify current password
      const [currentUser] = await sql`
        SELECT password FROM users WHERE id = ${user.id}
      `;
      
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      // Hash new password and update with password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      const [updatedUser] = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, password = ${hashedNewPassword}
        WHERE id = ${user.id}
        RETURNING id, name, email, profile_image
      `;
      
      return NextResponse.json(updatedUser);
    } else {
      // Update without password change
      const [updatedUser] = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}
        WHERE id = ${user.id}
        RETURNING id, name, email, profile_image
      `;
      
      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    console.error('Profile update error:', error);
    if ((error as Error).message === 'Unauthenticated') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
