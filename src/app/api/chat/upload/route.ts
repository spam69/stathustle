import { NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL_PREFIX } from '@/lib/r2-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  if (!r2Client) {
    console.error("/api/upload: R2 client is not initialized. Check R2 environment variables.");
    return NextResponse.json({ message: 'File storage is not configured on the server.' }, { status: 500 });
  }
  if (!R2_BUCKET_NAME) {
    console.error("/api/upload: R2_BUCKET_NAME is not configured.");
    return NextResponse.json({ message: 'Bucket name is not configured on the server.' }, { status: 500 });
  }
  if (!R2_PUBLIC_URL_PREFIX) {
    console.warn("/api/upload: CLOUDFLARE_R2_PUBLIC_URL_PREFIX is not set. Uploaded files may not be accessible via public URL.");
    return NextResponse.json({ message: 'Public URL prefix is not configured on the server.' }, { status: 500 });
  }


  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file found in the request.' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueKey = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);
    
    // Construct the public URL
    const baseUrl = R2_PUBLIC_URL_PREFIX.replace(/\/$/, '');
    const publicUrl = `${baseUrl}/${uniqueKey}`; 
    
    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('Error uploading to R2:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file upload.';
    return NextResponse.json({ message: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}
