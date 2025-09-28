# VIFM Business Development Portal

[![Deploy on Replit](https://replit.com/badge/github/yourusername/vifm-portal)](https://replit.com/new/github/yourusername/vifm-portal)

## 🚀 One-Click Deploy to Replit

1. Click the "Deploy on Replit" button above
2. Or go to [Replit.com](https://replit.com) → "Create Repl" → "Import from GitHub"
3. Enter this repository URL: `https://github.com/[yourusername]/vifm-portal`
4. Click "Import from GitHub"
5. Your portal will be live in seconds!

## 📋 Features

- **Consultant Module**: Track training opportunities and client interactions
- **BD Module**: Manage sales pipeline and business development  
- **Role-based Access**: Different modules for consultants, BD professionals, and admins
- **Cloud Database**: Real-time sync with Supabase
- **Session Management**: Secure login with auto-detection

## 🔐 Test Credentials

### Consultant Access
```
Email: aiman@vifm.ae
Password: password123
```

### BD Professional Access
```
Email: amal.kayed@vifm.ae  
Password: password123
```

### Admin Access
```
Email: admin@vifm.ae
Password: password123
```

## 🛠️ Setup Instructions

### Method 1: Import to Replit (Easiest)
1. Fork this repository to your GitHub account
2. Go to [Replit.com](https://replit.com)
3. Click "Create Repl" → "Import from GitHub"
4. Paste your forked repository URL
5. Click "Import from GitHub"
6. Done! Your portal is live

### Method 2: Manual Setup
1. Clone this repository
2. Upload files to your web server
3. Configure Supabase credentials
4. Access via browser

## 📁 Project Structure

```
vifm-portal/
├── index.html              # Entry point & router
├── login.html              # Authentication page
├── vifm-main-menu.html     # Main dashboard
├── phase1.html             # Consultant opportunities module
├── bd-module.html          # Business development module
├── test-portal.html        # System verification tool
├── .replit                 # Replit configuration
├── replit.nix             # Dependencies
└── README.md              # Documentation
```

## ⚙️ Supabase Configuration

### Quick Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `database/schema.sql`
3. Copy your project URL and anon key
4. Update the credentials in the HTML files

### Database Tables
- `opportunities` - Consultant training opportunities
- `bd_opportunities` - BD pipeline and sales tracking

## 🌐 Environment Variables (Optional)

If you want to use environment variables in Replit:

1. Click the 🔒 Secrets tab
2. Add these secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

## 📱 Mobile Support

The portal is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🧪 Testing

After deployment, access `test-portal.html` to run system checks:
- File integrity
- Database connection
- Session management
- Browser compatibility

## 🔧 Customization

### Change Company Name
Edit the header in each HTML file

### Add Logo
1. Upload your logo as `vifm-logo.png`
2. The system will automatically use it

### Modify Colors
Edit the CSS variables in the `:root` section

## 📊 Live Demo

Once deployed to Replit, your portal will be available at:
```
https://vifm-portal.[your-replit-username].repl.co
```

## 🐛 Troubleshooting

### Portal won't load
- Check all files are uploaded
- Clear browser cache
- Run test-portal.html

### Can't login
- Verify credentials are correct
- Check localStorage isn't blocked
- Try incognito mode

### Database errors
- Verify Supabase project is active
- Check API keys are correct
- Ensure tables are created

## 📄 License

© 2024 Virginia Institute of Finance and Management. All rights reserved.

## 🤝 Support

For issues or questions:
1. Check the documentation
2. Run the test tool
3. Review Supabase logs

---

**Ready to deploy?** Click the button at the top to import to Replit instantly! 🚀
