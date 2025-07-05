// Mark email as read/unread
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { uid, folder = 'INBOX', read = true } = req.body || req.query;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'UID is required'
      });
    }

    console.log(`📧 Marking email ${uid} as ${read ? 'read' : 'unread'} in ${folder}`);

    // In a real IMAP implementation, this would:
    // 1. Connect to IMAP server
    // 2. Select the folder
    // 3. Add or remove the \Seen flag
    // 4. Close the connection

    // For now, we'll simulate the operation
    return res.status(200).json({
      success: true,
      uid: uid,
      folder: folder,
      read: read,
      flags: read ? ['\\Seen'] : [],
      message: `Email ${uid} marked as ${read ? 'read' : 'unread'}`
    });

  } catch (error) {
    console.error('Email mark error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};