const postModel = require('../models/post');

const createPost = async (req, res) => {
  try {
    const { title, short_description, content } = req.body;
    const user_id = req.user.userId
    if (!user_id || !title || !short_description || !content) {
      return res.status(400).json({ message: 'User ID, title, short description, and content are required' });
    }

    const postId = await postModel.createPost(user_id, title, short_description, content);
    res.status(201).json({ message: 'Post created successfully', postId });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await postModel.incrementViews(postId);
    const updatedPost = await postModel.getPostById(postId);
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error getting post by ID:', error);
    res.status(500).json({ message: 'Failed to get post by ID' });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, short_description, content } = req.body;
    const userIdFromToken = req.user.userId;

    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== userIdFromToken) {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    const updated = await postModel.updatePost(postId, title, short_description, content);
    if (updated) {
      res.status(200).json({ message: 'Post updated successfully' });
    } else {
      res.status(404).json({ message: 'Post not found or not updated' });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};


const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userIdFromToken = req.user.userId;
    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== userIdFromToken) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    const deleted = await postModel.deletePost(postId);
    if (deleted) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found or not deleted' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};


const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await postModel.getPostsByUserId(userId);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error getting posts by user ID:', error);
    res.status(500).json({ message: 'Failed to get posts by user ID' });
  }
};


module.exports = {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getPostsByUserId
};