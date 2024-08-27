import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors } from '../controllers/userControllers.js';

const router = Router()

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/:id',getUser)
router.get('/',getAuthors)
router.post('/change-avatar',authMiddleware, changeAvatar)
router.patch('/edit-user',authMiddleware, editUser)

export default router;