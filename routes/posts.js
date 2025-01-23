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
const { uploadFeaturedImage } = require('../middleware/upload');

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
 *         multipart/form-data:
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
 *               featured_image:
 *                  type: string
 *                  format: binary
 *                  description: Featured image file for the post
 *             required:
 *               - title
 *               - short_description
 *               - content
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *          description: Internal Server Error
 */
router.post('/', authMiddleware, uploadFeaturedImage, postController.createPost);

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
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 id:
  *                   type: integer
  *                 title:
  *                   type: string
  *                 short_description:
  *                   type: string
  *                 content:
  *                   type: string
  *                 featured_image_url:
  *                   type: string
  *                   description: URL of the featured image
  *                 user_id:
  *                   type: integer
  *                 views:
  *                   type: integer
  *                 publication_date:
  *                   type: string
  *                   format: date-time
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
 *         multipart/form-data:
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
 *               featured_image:
 *                  type: string
 *                  format: binary
 *                  description: Featured image file for the post
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
router.put('/:id', authMiddleware, uploadFeaturedImage, postController.updatePost);

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

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   short_description:
 *                     type: string
 *                   content:
 *                     type: string
 *                   featured_image_url:
 *                     type: string
 *                     description: URL of the featured image
 *                   user_id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   avatar_url:
 *                     type: string
 *                   views:
 *                     type: integer
 *                   publication_date:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal Server Error
 */
router.get('/', postController.getAllPosts);

/**
 * @swagger
 * /posts/upload-content-image:
 *   post:
 *     summary: Upload an image for post content
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content_image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the uploaded image
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.post('/upload-content-image', authMiddleware, uploadFeaturedImage, postController.uploadContentImage);

module.exports = router;