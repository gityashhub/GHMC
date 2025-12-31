import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const optionalEnvVars = {
  PORT: 3000,
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:8080',
  JWT_REFRESH_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRES_IN: '30d',
};

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file');
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || optionalEnvVars.PORT, 10),
  nodeEnv: process.env.NODE_ENV || optionalEnvVars.NODE_ENV,
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || optionalEnvVars.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET || optionalEnvVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || optionalEnvVars.JWT_REFRESH_EXPIRES_IN,
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || optionalEnvVars.FRONTEND_URL,
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export default config;

