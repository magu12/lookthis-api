/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts
 */
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the post
 *               short_description:
 *                  type: string
 *                  description: Short description of the post
 *               content:
 *                  type: string
 *                  description: Content of the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *          description: Internal Server Error
 */
router.post('/', authMiddleware, postController.createPost);

/**
  * @swagger
  * /posts/{id}:
  *   get:
  *     summary: Get a post by ID
  *     tags: [Posts]
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         description: ID of the post
  *         schema:
  *           type: integer
  *     responses:
  *       200:
  *         description: Successful response
  *       404:
  *         description: Post not found
  *       500:
  *          description: Internal Server Error
  */
router.get('/:id', postController.getPostById);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the post
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the post
 *               short_description:
 *                  type: string
 *                  description: Short description of the post
 *               content:
 *                  type: string
 *                  description: Content of the post
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Bad Request
 *       403:
 *          description: Unauthorized
 *       404:
 *          description: Not found
 *       500:
 *          description: Internal Server Error
 */
router.put('/:id', authMiddleware, postController.updatePost);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the post
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *          description: Not found
 *       500:
 *          description: Internal Server Error
 */
router.delete('/:id', authMiddleware, postController.deletePost);

/**
  * @swagger
  * /posts/user/{userId}:
  *   get:
  *     summary: Get all posts by user ID
  *     tags: [Posts]
  *     parameters:
  *       - in: path
  *         name: userId
  *         required: true
  *         description: ID of the user
  *         schema:
  *           type: integer
  *     responses:
  *       200:
  *         description: Successful response
  *       500:
  *          description: Internal Server Error
  */
router.get('/user/:userId', postController.getPostsByUserId)

module.exports = router;