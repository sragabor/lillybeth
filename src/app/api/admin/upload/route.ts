import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processImage, UPLOAD_CONFIG } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directory = (formData.get('directory') as string) || UPLOAD_CONFIG.paths.uploads;
    const prefix = formData.get('prefix') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate MIME type (basic check before processing)
    if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type as never)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Process image
    const result = await processImage({
      file,
      directory,
      prefix: prefix || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handle DELETE for removing uploaded images
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Import deleteImage dynamically to avoid issues
    const { deleteImage } = await import('@/lib/upload');
    await deleteImage(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
