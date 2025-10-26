const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes (không cần authentication)
router.post('/login', authController.login);
router.get('/warehouses', authController.getAllWarehouses);
router.get('/test-connection/:TenKho', authController.testDatabaseConnection);
router.get('/test-master', authController.testMasterConnection);

module.exports = router;
