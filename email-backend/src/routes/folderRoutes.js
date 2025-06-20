const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');

// Get all folders
router.get('/', folderController.getFolders);

// Create custom folder
router.post('/', folderController.createFolder);

// Rename folder
router.put('/:path', folderController.renameFolder);

// Delete folder
router.delete('/:path', folderController.deleteFolder);

// Get folder statistics
router.get('/:path/stats', folderController.getFolderStats);

module.exports = router;