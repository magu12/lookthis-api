const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc')
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts')
const cookieParser = require('cookie-parser');
const fs = require('fs');

require('dotenv').config()

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [...(process.env.NODE_ENV === 'production' 
    ? ['https://lookthis-back-7b143ea18689.herokuapp.com', 'https://lookthis.io']
    : []), 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/avatars')){
    fs.mkdirSync('uploads/avatars');
}

app.use('/uploads', express.static('uploads'));

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