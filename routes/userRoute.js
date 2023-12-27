const express = require('express')
const router = express.Router()
const app = express()

const userController = require('../controllers/userController')

router.get('/register', userController.loadUserRegister)
router.post('/register', userController.registerUser)


router.get('/login', (req, res) => {
    res.render('login')
})


module.exports = router


 