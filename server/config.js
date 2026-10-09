export const DEV_MONGODB_URI = 'mongodb://127.0.0.1:27017/voguevibe';
export const DEV_JWT_SECRET = 'dev-jwt-secret-change-me-to-a-long-random-string';

export function resolveRuntimeConfig(env = process.env) {
  const isProd = env.NODE_ENV === 'production';
  const PORT = Number(env.PORT || 3000);
  const MONGODB_URI = env.MONGODB_URI || (!isProd ? DEV_MONGODB_URI : undefined);
  const JWT_SECRET = env.JWT_SECRET || (!isProd ? DEV_JWT_SECRET : undefined);

  if (isProd && !MONGODB_URI) {
    throw new Error('Missing required env var: MONGODB_URI');
  }
  if (isProd && !JWT_SECRET) {
    throw new Error('Missing required env var: JWT_SECRET');
  }
  if (isProd && JWT_SECRET && JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return {
    isProd,
    PORT,
    MONGODB_URI,
    JWT_SECRET,
    CLIENT_ORIGIN: env.CLIENT_ORIGIN || false,
  };
}
