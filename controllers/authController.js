const userModel = require('../models/user');
const tokenModel = require('../models/token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      const isProduction = process.env.NODE_ENV === 'production';
      
      avatar_url = `${process.env.API_URL}/uploads/avatars/${req.file.filename}`;
      
      if (!isProduction) {
        console.warn(
          'Warning: File uploaded to localhost. In development environment, ' +
          'file uploads are not persisted. Using default avatar instead.'
        );
        avatar_url = null;
      }
    }

    const userId = await userModel.createUser(username, email, password, avatar_url);
    
    const { accessToken, refreshToken } = generateTokens(userId);
    await tokenModel.saveRefreshToken(userId, refreshToken);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({ message: 'User registered successfully' });
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
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Failed to log in user' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    const savedToken = await tokenModel.findRefreshToken(refreshToken);
    if (!savedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        await tokenModel.deleteRefreshToken(refreshToken);
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
      
      await tokenModel.deleteRefreshToken(refreshToken);
      await tokenModel.saveRefreshToken(decoded.userId, newRefreshToken);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ message: 'Tokens refreshed successfully' });
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    await tokenModel.deleteRefreshToken(refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

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