const router = require('express').Router()
const authMiddleware = require('../middleware/authMiddleware')
const teamController = require('../controllers/teamController')

router.use(authMiddleware)
router.get('/', teamController.getAll)
router.post('/', teamController.create)
router.get('/:id', teamController.getOne)
router.put('/:id', teamController.update)
router.delete('/:id', teamController.remove)

module.exports = router
