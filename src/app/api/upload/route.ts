
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
    const { fileData, fileName, fileType } = await request.json();

    if (!fileData || !fileName || !fileType) {
      return NextResponse.json({ message: 'Missing file data, name, or type.' }, { status: 400 });
    }

    // Decode base64 file data
    // The fileData is expected to be a Data URI: "data:<mime_type>;base64,<encoded_data>"
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
        return NextResponse.json({ message: 'Invalid file data format. Expected Data URI.' }, { status: 400 });
    }
    const buffer = Buffer.from(base64Data, 'base64');

    const fileExtension = fileName.split('.').pop() || 'bin';
    const uniqueKey = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME, // The bucket name is still needed for the S3 command
      Key: uniqueKey,
      Body: buffer,
      ContentType: fileType,
    });

    await r2Client.send(command);
    
    // Construct the public URL: BASE_PUBLIC_URL/UNIQUE_KEY
    // This assumes the custom domain (R2_PUBLIC_URL_PREFIX) directly serves the bucket root.
    // Ensure R2_PUBLIC_URL_PREFIX does not have a trailing slash for this construction.
    const baseUrl = R2_PUBLIC_URL_PREFIX.replace(/\/$/, ''); // Remove trailing slash if present
    const publicUrl = `${baseUrl}/${uniqueKey}`; 
    
    return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('Error uploading to R2:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file upload.';
    return NextResponse.json({ message: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}
