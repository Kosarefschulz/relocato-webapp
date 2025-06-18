// Email search without Firebase for now

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query = '', folder = 'all' } = req.query;
    
    console.log(`🔍 Searching emails for: ${query} in folder: ${folder}`);
    
    // For now, return empty results since we don't have Firebase set up
    // In production, this would search through stored emails in Firestore
    res.status(200).json({
      emails: [],
      query: query,
      folder: folder,
      count: 0,
      message: 'Email search is currently not available. Please sync emails first.'
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search emails',
      details: error.message
    });
  }
}