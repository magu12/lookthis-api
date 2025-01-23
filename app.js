require('dotenv').config();

console.log('Starting application...');
console.log('NODE_ENV:', process.env.NODE_ENV);

const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc')
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts')
const cookieParser = require('cookie-parser');

// Log all environment variables (except secrets)
console.log('Checking environment variables...');
const safeEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'CLOUDINARY_CLOUD_NAME'
];

safeEnvVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
});

// Initialize database connection
const db = require('./config/db');
console.log('Initializing database connection...');

// Test database connection
db.query('SELECT 1')
  .then(() => {
    console.log('Database connection successful');
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function(origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'https://lookthis-front-0d9b3ca95599.herokuapp.com', 
      'https://lookthis.io', 
      'http://localhost:3000',
      'https://lookthis-back-7b143ea18689.herokuapp.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie', 'Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
  preflightContinue: false
};

// Apply CORS before any other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Error handling for CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('CORS Error:', err.message);
    return res.status(403).json({
      error: 'CORS not allowed for this origin'
    });
  }
  next(err);
});

app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));
app.use(express.json());

app.use((req, res, next) => {
  res.cookie = res.cookie.bind(res);
  const originalCookie = res.cookie;
  
  res.cookie = function (name, value, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
    };
    
    return originalCookie.call(this, name, value, { ...defaultOptions, ...options });
  };
  
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lookthis API',
      version: '1.0.0',
      description: 'API for Lookthis Blog',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://lookthis-back-7b143ea18689.herokuapp.com/api'
          : `http://localhost:${PORT}/api`,
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken'
        }
      }
    }
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});