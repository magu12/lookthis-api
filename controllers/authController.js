const userModel = require('../models/user');
const tokenModel = require('../models/token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

// Запускаем периодическую очистку
setInterval(async () => {
  try {
    const deletedCount = await tokenModel.cleanupOldTokens();
    console.log(`Cleaned up ${deletedCount} old refresh tokens`);
  } catch (error) {
    console.error('Error during token cleanup:', error);
  }
}, CLEANUP_INTERVAL);

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const writeStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    const readStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });
    
    readStream.pipe(writeStream);
  });
}

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let avatar_url = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        avatar_url = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ message: 'Failed to upload avatar' });
      }
    }

    const userId = await userModel.createUser(username, email, password, avatar_url);
    
    const { accessToken, refreshToken } = generateTokens(userId);
    await tokenModel.saveRefreshToken(userId, refreshToken);

    res.status(201).json({ 
      message: 'User registered successfully',
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await tokenModel.saveRefreshToken(user.id, refreshToken);

    res.status(200).json({ 
      message: 'Logged in successfully',
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Failed to log in user' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.body.refreshToken; // Теперь берем из тела запроса
    if (!oldRefreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }
    
    const savedToken = await tokenModel.findRefreshToken(oldRefreshToken);
    if (!savedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        await tokenModel.deleteRefreshToken(oldRefreshToken);
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
      
      await tokenModel.deleteRefreshToken(oldRefreshToken);
      await tokenModel.saveRefreshToken(decoded.userId, newRefreshToken);

      res.json({ 
        message: 'Tokens refreshed successfully',
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken; // Теперь берем из тела запроса
    if (refreshToken) {
      await tokenModel.deleteRefreshToken(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logout
};