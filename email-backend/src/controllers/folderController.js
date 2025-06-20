const ImapService = require('../services/imapService');

const imapService = new ImapService();

// Get all folders
exports.getFolders = async (req, res, next) => {
  try {
    const folders = await imapService.getFolders();
    
    // Add unread count for each folder
    const foldersWithStats = await Promise.all(
      folders.map(async (folder) => {
        try {
          const unreadCount = await imapService.searchEmails(
            folder.path, 
            ['UNSEEN']
          );
          return {
            ...folder,
            unreadCount: unreadCount.length
          };
        } catch (error) {
          return {
            ...folder,
            unreadCount: 0
          };
        }
      })
    );

    res.json(foldersWithStats);
  } catch (error) {
    next(error);
  }
};

// Create custom folder
exports.createFolder = async (req, res, next) => {
  try {
    const { name, parent } = req.body;
    
    // Implementation for creating folder
    res.json({ success: true, folder: { name, parent } });
  } catch (error) {
    next(error);
  }
};

// Rename folder
exports.renameFolder = async (req, res, next) => {
  try {
    const { path } = req.params;
    const { newName } = req.body;
    
    // Implementation for renaming folder
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Delete folder
exports.deleteFolder = async (req, res, next) => {
  try {
    const { path } = req.params;
    
    // Implementation for deleting folder
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Get folder statistics
exports.getFolderStats = async (req, res, next) => {
  try {
    const { path } = req.params;
    
    const totalEmails = await imapService.searchEmails(path, ['ALL']);
    const unreadEmails = await imapService.searchEmails(path, ['UNSEEN']);
    const flaggedEmails = await imapService.searchEmails(path, ['FLAGGED']);
    
    res.json({
      folder: path,
      stats: {
        total: totalEmails.length,
        unread: unreadEmails.length,
        flagged: flaggedEmails.length
      }
    });
  } catch (error) {
    next(error);
  }
};