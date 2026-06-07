const router = require('express').Router()
const authMiddleware = require('../middleware/authMiddleware')
const employeeController = require('../controllers/employeeController')

router.use(authMiddleware)
router.get('/', employeeController.getAll)
router.post('/', employeeController.create)
router.get('/:id', employeeController.getOne)
router.put('/:id', employeeController.update)
router.delete('/:id', employeeController.remove)
router.post('/:id/teams', employeeController.assignTeam)
router.delete('/:id/teams/:teamId', employeeController.removeFromTeam)

module.exports = router
