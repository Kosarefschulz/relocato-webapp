export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    service: 'Relocato API',
    timestamp: new Date().toISOString()
  });
}