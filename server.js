const express = require('express');
const path = require('path');
const { Client } = require('@microsoft/microsoft-graph-client');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client for server-side auth verification
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Cache for connection settings
let connectionSettings = null;

// Get Outlook access token
async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// Get Outlook client
async function getOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

// Send email notification
async function sendActivityNotification(activityData) {
  try {
    const client = await getOutlookClient();
    
    // Format activity details for email
    const emailBody = `
      <html>
        <body style="font-family: 'Open Sans', Arial, sans-serif; color: #111232;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #5391D5 0%, #010131 100%); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">New Activity Registered</h2>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <h3 style="color: #010131; margin-top: 0;">Activity Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 150px;">Date:</td>
                  <td style="padding: 8px 0;">${activityData.date || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Company:</td>
                  <td style="padding: 8px 0;">${activityData.company || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Contact:</td>
                  <td style="padding: 8px 0;">${activityData.contact || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Module:</td>
                  <td style="padding: 8px 0;">${activityData.module || 'N/A'}</td>
                </tr>
                ${activityData.stage ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Stage:</td>
                  <td style="padding: 8px 0;">${activityData.stage}</td>
                </tr>
                ` : ''}
                ${activityData.notes ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b; vertical-align: top;">Notes:</td>
                  <td style="padding: 8px 0;">${activityData.notes}</td>
                </tr>
                ` : ''}
                ${activityData.next_actions ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #64748b; vertical-align: top;">Next Actions:</td>
                  <td style="padding: 8px 0;">${activityData.next_actions}</td>
                </tr>
                ` : ''}
              </table>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                <p style="margin: 0;">This is an automated notification from the VIFM Portal.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const message = {
      subject: `New Activity: ${activityData.company || 'Unknown Company'}`,
      body: {
        contentType: 'HTML',
        content: emailBody
      },
      toRecipients: [
        {
          emailAddress: {
            address: 'asadeq@viftraining.com'
          }
        }
      ]
    };

    await client.api('/me/sendMail').post({
      message: message,
      saveToSentItems: true
    });

    console.log('✅ Email notification sent successfully to asadeq@viftraining.com');
    return { success: true };
  } catch (error) {
    console.error('❌ Email notification failed:', error);
    return { success: false, error: error.message };
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to sanitize HTML content
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to verify and decode Supabase JWT token
async function verifyAuth(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Token validation failed:', error?.message || 'No user');
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ Auth verification error:', error);
    return null;
  }
}

// API endpoint to send activity notification (authenticated)
app.post('/api/notify-activity', async (req, res) => {
  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    console.log(`✅ Authenticated request from user: ${user.email}`);
    const activityData = req.body;
    
    // Basic validation
    if (!activityData || !activityData.company) {
      return res.status(400).json({ error: 'Invalid activity data' });
    }

    // Sanitize all input data before sending email
    const sanitizedData = {
      date: escapeHtml(activityData.date),
      company: escapeHtml(activityData.company),
      contact: escapeHtml(activityData.contact),
      module: escapeHtml(activityData.module),
      stage: escapeHtml(activityData.stage),
      notes: escapeHtml(activityData.notes),
      next_actions: escapeHtml(activityData.next_actions)
    };

    // Send email in background (non-blocking)
    sendActivityNotification(sanitizedData).catch(err => {
      console.error('Background email send failed:', err);
    });
    
    // Respond immediately
    res.json({ success: true, message: 'Notification queued' });
    
  } catch (error) {
    console.error('Error in notify-activity endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supabase webhook endpoint for database triggers
app.post('/api/supabase-webhook', async (req, res) => {
  try {
    // Parse webhook payload
    const payload = req.body;
    
    console.log('📨 Received Supabase webhook:', payload.type);
    
    // Check if this is an INSERT event on activity-related table
    if (payload.type === 'INSERT' && payload.record) {
      const activityData = {
        date: payload.record.date || payload.record.created_at,
        company: payload.record.company_name || payload.record.company,
        contact: payload.record.contact_person || payload.record.contact,
        module: payload.table === 'bd_opportunities' ? 'Business Development' : 'Consultant Opportunities',
        stage: payload.record.stage,
        notes: payload.record.bd_notes || payload.record.consultant_notes || payload.record.notes,
        next_actions: payload.record.next_actions
      };
      
      // Send email notification
      await sendActivityNotification(activityData);
    }
    
    // Always respond 200 to prevent webhook retries
    res.json({ received: true });
  } catch (error) {
    console.error('Error in webhook endpoint:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ received: true, error: error.message });
  }
});

// No catch-all route needed - express.static handles all files

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VIFM Portal server running on http://0.0.0.0:${PORT}`);
  console.log('📧 Email notifications enabled via Microsoft Outlook');
});
