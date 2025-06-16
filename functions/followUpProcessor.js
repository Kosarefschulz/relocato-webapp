const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// SMTP-Konfiguration für IONOS
const smtpConfig = {
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: 'bielefeld@relocato.de',
    pass: 'Bicm1308'
  }
};

// Transporter erstellen
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Scheduled function that runs every hour to process pending follow-ups
 */
exports.processFollowUps = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 1 hours')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('🔄 Starting follow-up processor...');
    
    try {
      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      
      // Get all pending follow-ups that are due
      const followUpsSnapshot = await db.collection('scheduledFollowUps')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', now)
        .get();
      
      console.log(`📧 Found ${followUpsSnapshot.size} follow-ups to process`);
      
      const processPromises = followUpsSnapshot.docs.map(async (doc) => {
        const followUp = { id: doc.id, ...doc.data() };
        
        try {
          // Get the rule
          const ruleDoc = await db.collection('followUpRules').doc(followUp.ruleId).get();
          if (!ruleDoc.exists) {
            throw new Error('Follow-up rule not found');
          }
          
          const rule = ruleDoc.data();
          
          // Get email template
          const templateDoc = await db.collection('emailTemplates').doc(rule.emailTemplateId).get();
          if (!templateDoc.exists) {
            throw new Error('Email template not found');
          }
          
          const template = templateDoc.data();
          
          // Get customer data
          const customerDoc = await db.collection('customers').doc(followUp.customerId).get();
          if (!customerDoc.exists) {
            throw new Error('Customer not found');
          }
          
          const customer = customerDoc.data();
          
          // Prepare variables for template
          const variables = {
            customerName: customer.name || '',
            customerEmail: customer.email || '',
            customerPhone: customer.phone || '',
            moveDate: customer.movingDate ? new Date(customer.movingDate).toLocaleDateString('de-DE') : '',
            fromAddress: `${customer.address?.street || ''}, ${customer.address?.city || ''}`,
            toAddress: `${customer.movingToAddress?.street || ''}, ${customer.movingToAddress?.city || ''}`,
            currentDate: new Date().toLocaleDateString('de-DE'),
            companyName: 'RELOCATO® Bielefeld',
            companyPhone: '(0521) 1200551-0',
            companyEmail: 'bielefeld@relocato.de',
            employeeName: 'Thomas Schmidt'
          };
          
          // Get quote data if available
          if (followUp.quoteId) {
            const quoteDoc = await db.collection('quotes').doc(followUp.quoteId).get();
            if (quoteDoc.exists) {
              const quote = quoteDoc.data();
              variables.quoteNumber = followUp.quoteId;
              variables.quotePrice = `€ ${quote.price.toFixed(2)}`;
              const validUntil = new Date();
              validUntil.setDate(validUntil.getDate() + 14);
              variables.quoteValidUntil = validUntil.toLocaleDateString('de-DE');
            }
          }
          
          // Replace variables in template
          let subject = template.subject;
          let content = template.content;
          
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            content = content.replace(regex, value);
          });
          
          // Convert markdown-style content to HTML
          const htmlContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
          
          // Send email
          const mailOptions = {
            from: '"RELOCATO® Bielefeld" <bielefeld@relocato.de>',
            to: followUp.customerEmail,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #8BC34A; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">RELOCATO®</h1>
                </div>
                <div style="padding: 20px;">
                  ${htmlContent}
                </div>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                  <p>RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld</p>
                  <p>Tel: (0521) 1200551-0 | E-Mail: bielefeld@relocato.de</p>
                </div>
              </div>
            `,
            text: content
          };
          
          await transporter.sendMail(mailOptions);
          
          // Update follow-up status
          await db.collection('scheduledFollowUps').doc(followUp.id).update({
            status: 'sent',
            lastAttemptAt: admin.firestore.Timestamp.now()
          });
          
          // Update rule sent count
          await db.collection('followUpRules').doc(rule.id).update({
            sentCount: admin.firestore.FieldValue.increment(1),
            lastRunAt: admin.firestore.Timestamp.now()
          });
          
          // Save to email history
          await db.collection('emailHistory').add({
            customerId: followUp.customerId,
            customerName: followUp.customerName,
            to: followUp.customerEmail,
            subject: subject,
            content: content,
            templateType: 'follow_up',
            sentAt: admin.firestore.Timestamp.now(),
            status: 'sent'
          });
          
          console.log(`✅ Follow-up sent to ${followUp.customerEmail}`);
          
        } catch (error) {
          console.error(`❌ Error processing follow-up ${followUp.id}:`, error);
          
          // Update follow-up with error
          await db.collection('scheduledFollowUps').doc(followUp.id).update({
            status: 'failed',
            attempts: (followUp.attempts || 0) + 1,
            lastAttemptAt: admin.firestore.Timestamp.now(),
            error: error.message
          });
        }
      });
      
      await Promise.all(processPromises);
      
      console.log('✅ Follow-up processor completed');
      return null;
      
    } catch (error) {
      console.error('❌ Follow-up processor error:', error);
      throw error;
    }
  });

/**
 * HTTP endpoint to manually trigger follow-up processing
 */
exports.triggerFollowUpProcessor = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    try {
      // Trigger the scheduled function manually
      await exports.processFollowUps();
      res.json({ success: true, message: 'Follow-up processor triggered successfully' });
    } catch (error) {
      console.error('Error triggering follow-up processor:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });