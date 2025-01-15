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

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userIdFromToken = req.user.userId; // Получаем ID из токена

    // Проверяем, что пользователь обновляет свой профиль
    if (parseInt(userId) !== userIdFromToken) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const { username, avatar_url } = req.body;
    if (!username || !avatar_url) {
      return res.status(400).json({ message: 'Username and avatar URL are required' });
    }
    
    const updated = await userModel.updateUser(userId, username, avatar_url);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const userIdFromToken = req.user.userId; // Получаем ID из токена

    // Проверяем, что пользователь меняет свой пароль
    if (parseInt(userId) !== userIdFromToken) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    const updated = await userModel.updateUserPassword(userId, newPassword);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User password updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ message: 'Failed to update user password' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserPassword
};