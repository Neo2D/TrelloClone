import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import sql from '@/lib/db';

// POST - Update profile photo
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const contentType = req.headers.get('content-type');
    
    let imageUrl: string;
    
    if (contentType?.includes('application/json')) {
      // Handle URL upload
      const { imageUrl: providedUrl } = await req.json();
      
      if (!providedUrl?.trim()) {
        return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
      }
      
      // Basic URL validation
      try {
        new URL(providedUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
      
      imageUrl = providedUrl;
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('image') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
      }
      
      // For now, we'll just return a placeholder since we don't have file storage set up
      // In a real app, you would upload to AWS S3, Cloudinary, etc.
      imageUrl = `https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=${encodeURIComponent(user.name.charAt(0).toUpperCase())}`;
      
      // TODO: Implement actual file upload to cloud storage
      console.log('File upload received:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    
    // Update user profile image in database
    const [updatedUser] = await sql`
      UPDATE users 
      SET profile_image = ${imageUrl}
      WHERE id = ${user.id}
      RETURNING id, name, email, profile_image
    `;
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile image' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Profile photo updated successfully',
      imageUrl: updatedUser.profile_image 
    });
  } catch (error) {
    console.error('Profile photo update error:', error);
    if ((error as Error).message === 'Unauthenticated') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 });
  }
}
