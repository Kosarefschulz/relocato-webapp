export default async function handler(req, res) {
  // Test endpoint to check email configuration
  const config = {
    hasVercelVariables: !!(process.env.VERCEL_IONOS_EMAIL && process.env.VERCEL_IONOS_PASSWORD),
    variables: {
      email: process.env.VERCEL_IONOS_EMAIL ? 'SET' : 'NOT SET',
      password: process.env.VERCEL_IONOS_PASSWORD ? 'SET' : 'NOT SET',
      smtp_host: process.env.VERCEL_SMTP_HOST || 'smtp.ionos.de',
      smtp_port: process.env.VERCEL_SMTP_PORT || '587'
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(config);
}