/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints for user authentication
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the new user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for the new user
 *               password:
 *                 type: string
 *                 description: Password for the new user
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User's avatar image (optional)
 *     responses:
 *       201:
 *         description: User registered successfully and tokens set in cookies
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.post('/register', upload.single('avatar'), authController.registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               password:
 *                 type: string
 *                 description: Password of the user
 *     responses:
 *       200:
 *         description: User logged in successfully and tokens set in cookies
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', authController.loginUser);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using httpOnly cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or missing refresh token
 *       500:
 *         description: Internal Server Error
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and clear auth cookies
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User logged out successfully and cookies cleared
 *       500:
 *         description: Internal Server Error
 */
router.post('/logout', authController.logout);

module.exports = router;