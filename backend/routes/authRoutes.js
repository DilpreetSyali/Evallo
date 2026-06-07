const router = require('express').Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)

module.exports = router
