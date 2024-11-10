/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 * 
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */



/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token generated
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */




/**
@swagger
 * /api/movies:
 *   get:
 *     summary: Get movies data (requires JWT token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the movies data
 *       403:
 *         description: Unauthorized
 */