const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');

dotenv.config();

const app = express();

// --- Middlewares ---
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// --- Connect to DBs ---
connectDB();
connectRedis();

// --- Background Workers ---
require('./src/queues/alertProcessor');
require('./src/queues/alertScheduler');

// --- Routes ---
app.use('/api/users',     require('./src/routes/userRoutes'));
app.use('/api/portfolio', require('./src/routes/portfolioRoutes'));
app.use('/api/alerts', require('./src/routes/alertRoutes'));

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// --- Global Error Handler (always last) ---
app.use(require('./src/middlewares/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});