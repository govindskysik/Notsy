const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express =require("express")
const app=express()
const connectDB=require('./db/connect')
const authenticateUser = require('./middlewares/authenticate');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

// CORS configuration. FRONTEND_URL may contain one or more comma-separated
// origins, for example a production Vercel URL and the local Vite URL.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header include server-to-server calls and tools.
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS with options
app.use(cors(corsOptions));

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Lightweight public endpoint for deployment and uptime checks.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/notsy/auth', require('./routes/auth'));
app.use('/notsy', authenticateUser, require('./routes/index'));

// Listen function & connect to database
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`database connected and listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
