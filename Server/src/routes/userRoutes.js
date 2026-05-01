const express = require("express");
const { registerUser, loginUser, logoutUser } = require('../controllers/userControllers');
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/auth', authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authorized - User found",
        data: req.user
    });
});

module.exports = router;