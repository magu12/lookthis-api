/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for managing users
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get a list of all users
 *     tags: [Users]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *          description: Internal Server Error
 */
router.get('/', authMiddleware, userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: User not found
 *       500:
 *          description: Internal Server Error
 */
router.get('/:id', authMiddleware, userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username for the user
 *               avatar:
 *                 type: string
 *                 description: New avatar URL for the user
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad Request
 *       403:
 *          description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *          description: Internal Server Error
 */
router.put('/:id', authMiddleware, userController.updateUser);

/**
 * @swagger
 * /users/{id}/password:
 *   put:
 *     summary: Update a user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad Request
 *       403:
 *          description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *          description: Internal Server Error
 */
router.put('/:id/password', authMiddleware, userController.updateUserPassword);

module.exports = router;