import { Router } from 'express';
import { createPost, editPost, getCatPosts, getPost, getUserPosts, getPosts, deletePost } from '../controllers/postControllers.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router()

router.post("/", authMiddleware, createPost);
router.get("/",getPosts);
router.get("/:id",getPost);
router.patch("/:id", authMiddleware, editPost);
router.get("/categories/:category",getCatPosts);
router.get("/users/:id",getUserPosts);
router.delete("/:id",authMiddleware, deletePost);

export default router