const userModel = require('../models/user');
const postModel = require('../models/post');

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

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = {};

    // Only add username to updates if it's provided
    if (req.body.username) {
      updates.username = req.body.username;
    }
    
    // Handle avatar upload if provided
    if (req.file) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      updates.avatar_url = `${process.env.API_URL}/uploads/avatars/${req.file.filename}`;
      
      if (!isProduction) {
        console.warn(
          'Warning: File uploaded to localhost. In development environment, ' +
          'file uploads are not persisted. Using default avatar instead.'
        );
        updates.avatar_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiNFMkU4RjAiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iNDAiIGZpbGw9IiM5NEEzQjgiLz48cGF0aCBkPSJNMTYwIDE4MEExMDAgMTAwIDAgMCAxIDQwIDE4MEMzOS45OTk5IDE0MCA2NS45OTk5IDExMCAxMDAgMTEwQzEzNCAxMTAgMTYwIDE0MCAxNjAgMTgwWiIgZmlsbD0iIzk0QTNCOCIvPjwvc3ZnPg==';
      }
    } else if (req.body.avatar_url) {
      updates.avatar_url = req.body.avatar_url;
    }

    // Only proceed with update if there are changes to make
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    const updated = await userModel.updateUser(userId, updates);

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
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