const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc')
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts')
const cookieParser = require('cookie-parser');

require('dotenv').config()

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://lookthis-back-7b143ea18689.herokuapp.com', 'https://lookthis.io', 'http://localhost:3000']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie', 'Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));
app.use(cors(corsOptions));
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