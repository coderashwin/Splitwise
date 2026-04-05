/**
 * Jest global setup — runs before any test module is imported.
 * Stubs all required environment variables so the Zod env schema doesn't fail.
 */

// MongoDB — real connection provided by mongodb-memory-server in each test
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['MONGODB_URI'] = 'mongodb://localhost:27017'; // overridden by mongo-memory-server
process.env['MONGODB_DB_NAME'] = 'splitpro_test';
process.env['REDIS_URL'] = 'redis://localhost:6379';

// JWT — dummy RSA key pair (not real, only for env schema validation)
process.env['JWT_PRIVATE_KEY_BASE64'] = Buffer.from('dummy_private_key').toString('base64');
process.env['JWT_PUBLIC_KEY_BASE64'] = Buffer.from('dummy_public_key').toString('base64');
process.env['JWT_ISSUER'] = 'splitpro-test';
process.env['JWT_ACCESS_TOKEN_TTL_SECONDS'] = '900';
process.env['JWT_REFRESH_TOKEN_TTL_SECONDS'] = '2592000';

// Google OAuth
process.env['GOOGLE_CLIENT_ID'] = 'test_google_client_id';
process.env['GOOGLE_CLIENT_SECRET'] = 'test_google_client_secret';

// AWS
process.env['AWS_REGION'] = 'ap-south-1';
process.env['AWS_ACCESS_KEY_ID'] = 'test_key_id';
process.env['AWS_SECRET_ACCESS_KEY'] = 'test_secret_key';
process.env['S3_BUCKET_NAME'] = 'test-bucket';
process.env['CLOUDFRONT_URL'] = 'https://cdn.example.com';
process.env['MAX_FILE_SIZE_BYTES'] = '10485760';
process.env['UPLOAD_PRESIGN_TTL_SECONDS'] = '300';

// Firebase
process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'] = Buffer.from(
  JSON.stringify({ type: 'service_account', project_id: 'test' })
).toString('base64');

// Rate limiting
process.env['RATE_LIMIT_WINDOW_MS'] = '60000';
process.env['RATE_LIMIT_MAX'] = '100';
process.env['AUTH_RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['AUTH_RATE_LIMIT_MAX'] = '10';

// Allowed origins
process.env['ALLOWED_ORIGINS'] = 'http://localhost:3000';
