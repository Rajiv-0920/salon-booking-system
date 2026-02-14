import { Router } from 'express';
import * as controller from '../controllers/category.controller.js';
import { admin, protect } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category management APIs (Admin Only for modifications)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f9c1e8b5a3d45c2a9e1111
 *         name:
 *           type: string
 *           example: Hair Care
 *         description:
 *           type: string
 *           example: All hair related services
 */

/* =====================================================
   PUBLIC ROUTES
===================================================== */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', controller.getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/:id', controller.getCategoryById);

/* =====================================================
   ADMIN PROTECTED ROUTES
===================================================== */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', protect, admin, controller.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (Admin only)
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', protect, admin, controller.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (Admin only)
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/:id', protect, admin, controller.deleteCategory);

export default router;
