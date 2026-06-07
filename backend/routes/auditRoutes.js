const router = require('express').Router()
const authMiddleware = require('../middleware/authMiddleware')
const auditController = require('../controllers/auditController')

router.use(authMiddleware)
router.get('/', auditController.getAll)

module.exports = router
