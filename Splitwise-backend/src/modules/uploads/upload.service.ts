import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '../../config/s3';
import { env } from '../../config/env';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { createLogger } from '../../shared/utils/logger';

const log = createLogger('upload.service');

type AllowedFileType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
type UploadContext = 'receipt' | 'avatar' | 'group-image';

const ALLOWED_TYPES: AllowedFileType[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function getFileExtension(fileType: AllowedFileType): string {
  switch (fileType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'application/pdf': return 'pdf';
  }
}

function buildS3Key(context: UploadContext, userId: string, ext: string, groupId?: string): string {
  switch (context) {
    case 'receipt':
      return `receipts/${userId}/${uuidv4()}.${ext}`;
    case 'avatar':
      return `avatars/${userId}/${uuidv4()}.${ext}`;
    case 'group-image':
      return `group-images/${groupId ?? userId}/${uuidv4()}.${ext}`;
  }
}

function isPublicContext(context: UploadContext): boolean {
  return context === 'avatar' || context === 'group-image';
}

export interface PresignResult {
  uploadUrl: string;
  key: string;
  downloadUrl: string;
}

export async function presignUpload(params: {
  fileType: AllowedFileType;
  fileSize: number;
  context: UploadContext;
  userId: string;
  groupId?: string;
}): Promise<PresignResult> {
  const { fileType, fileSize, context, userId, groupId } = params;

  // Validate against allowlist
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw new ValidationError(`File type ${fileType} is not allowed`);
  }

  // Validate file size
  if (fileSize > env.MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size ${fileSize} bytes exceeds maximum of ${env.MAX_FILE_SIZE_BYTES} bytes`
    );
  }

  if (fileSize <= 0) {
    throw new ValidationError('File size must be positive');
  }

  const ext = getFileExtension(fileType);
  const key = buildS3Key(context, userId, ext, groupId);

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
    Metadata: { uploadedBy: userId },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: env.UPLOAD_PRESIGN_TTL_SECONDS,
  });

  let downloadUrl: string;
  if (isPublicContext(context)) {
    // Public files served via CloudFront
    downloadUrl = `${env.CLOUDFRONT_URL}/${key}`;
  } else {
    // Private receipts — presigned GET URL
    const getCommand = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });
    downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  }

  log.info({ context, key, userId }, 'Presigned URL generated');
  return { uploadUrl, key, downloadUrl };
}

export async function deleteFile(key: string, userId: string): Promise<void> {
  // Verify the file belongs to the requesting user
  const isOwned =
    key.startsWith(`receipts/${userId}/`) ||
    key.startsWith(`avatars/${userId}/`) ||
    key.startsWith(`group-images/${userId}/`);

  if (!isOwned) {
    throw new ForbiddenError('You can only delete your own files');
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    })
  );

  log.info({ key, userId }, 'File deleted from S3');
}
