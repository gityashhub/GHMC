import morgan from 'morgan';
import { config } from '../config/env.js';

export const requestLogger = morgan(
  config.nodeEnv === 'development' ? 'dev' : 'combined',
  {
    skip: (req, res) => {
      // Skip logging for health check endpoints
      return req.path === '/health';
    },
  }
);

export default requestLogger;

