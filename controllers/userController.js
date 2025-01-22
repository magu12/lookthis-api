const userModel = require('../models/user');
const postModel = require('../models/post');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userPosts = await postModel.getPostsByUserId(userId);
    const userWithPosts = { ...user, posts: userPosts };
    delete userWithPosts.password; 
    res.status(200).json(userWithPosts);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Failed to get user by ID' });
  }
};

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

const updateProfile = async (req, res) => {
  try {
    console.log('Starting profile update');
    const userId = req.user.userId;
    const updates = {};

    if (req.body.username) {
      console.log('Updating username:', req.body.username);
      updates.username = req.body.username;
    }
    
    if (req.file) {
      console.log('Starting Cloudinary upload');
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        console.log('File successfully uploaded to Cloudinary:', result.secure_url);
        updates.avatar_url = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log('No updates provided');
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    console.log('Updating user in database:', updates);
    const updated = await userModel.updateUser(userId, updates);
    if (!updated) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Profile updated successfully');
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId; // Получаем ID прямо из токена
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    const updated = await userModel.updateUserPassword(userId, newPassword);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    console.log('getCurrentUser called, user object:', req.user);

    const userId = req.user.userId; 
    
    if (!userId || isNaN(userId)) {
      console.error('Invalid userId from token:', userId);
      return res.status(401).json({ message: 'Invalid user ID in token' });
    }

    const user = await userModel.getUserById(userId);
    console.log('User from DB:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updatePassword,
  getCurrentUser
};