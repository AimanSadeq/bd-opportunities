# VIFM Portal

## Overview

The VIFM (Virginia Institute of Finance and Management) Portal is a role-based business development and consultant management system. It provides separate modules for consultants to track training opportunities and for business development professionals to manage sales pipelines. The system features secure authentication, role-based access control, and real-time data synchronization through cloud infrastructure.

## User Preferences

- **Communication Language**: Always respond in English
- **Communication Style**: Simple, everyday language
- **Database Access**: NEVER use Replit local PostgreSQL database. Application uses Supabase cloud database exclusively. All data queries must use Supabase client in application code.

## Production Upgrade Status

### ✅ Option A: Real Authentication System (COMPLETED - Sep 30, 2025)

**Implemented:**
- Removed all temporary authentication bypasses (quick admin login, demo credentials, development bypass)
- Enabled proper Supabase email/password authentication
- Created admin user management panel (admin-users.html)
- Implemented password reset functionality  
- Added User Management module to admin navigation
- Security hardening: Only anon key exposed, no service role key in client code
- Admin setup documentation: See ADMIN-SETUP-INSTRUCTIONS.md

### ✅ Email Notification System (COMPLETED - Oct 1, 2025)

**Implemented:**
- Express server backend (server.js) replacing Python HTTP server
- Microsoft Outlook integration via Replit connector for email sending
- Automated email notifications to akayed@viftraining.com on activity registration
- Email triggers in both Consultant Opportunities and Business Development modules
- Authentication protection on API endpoints
- HTML sanitization for email content security
- Non-blocking email delivery for optimal UX

**Email-based Access Control:**
- akayed@viftraining.com and wael@viftraining.com restricted to BD module only
- Consultant module completely hidden from their dashboard
- Direct URL access blocked with automatic redirect

**Next Steps Available:**
- **Option B**: Deploy to Production - Make portal live with public URL
- **Option C**: Complete Security Hardening - Enable RLS policies, audit logging, security headers, rate limiting

## System Architecture

### Frontend Architecture
- **Static HTML/CSS/JavaScript**: Pure client-side application with no build process
- **Modular Design**: Separate HTML files for each role and functionality (consultant module, BD module, main dashboard)
- **Pre-render Security**: Authentication checks executed immediately on page load before content display
- **Role-based Routing**: Different entry points based on user roles with universal route guards

### Backend Architecture
- **Express Server**: Node.js/Express server serves static files and provides API endpoints
- **Email Service**: Microsoft Graph API integration for transactional emails
- **API Endpoints**: Authenticated REST endpoints for notifications and webhooks
- **Security**: Bearer token authentication, HTML sanitization, non-blocking operations

### Authentication & Authorization
- **Session-based Authentication**: Persistent login sessions with automatic refresh
- **Role-based Access Control**: Three distinct roles (consultant, bd, admin) with module-specific access
- **Pre-render Protection**: Content hidden until authentication is verified to prevent unauthorized access
- **Universal Route Guards**: Centralized security system protecting all non-public pages

### Data Management
- **Supabase Integration**: Cloud-hosted PostgreSQL database with real-time capabilities
- **Client-side Data Layer**: JavaScript modules handle database operations and state management
- **Environment Configuration**: Template-based environment variable system for secure credential management

### Security Implementation
- **Environment Variable Protection**: Credentials stored in Replit secrets, not in code
- **Session Validation**: Automatic session expiry checking and renewal
- **Route Protection**: All protected pages require valid authentication before rendering
- **Secure Initialization**: Multi-step authentication verification on application startup

### Application Structure
- **Public Pages**: Login and landing pages accessible without authentication
- **Protected Modules**: Role-specific dashboards and functionality requiring authentication
- **Test Framework**: Built-in system testing capabilities for production validation
- **Deployment Ready**: Configured for one-click deployment to Replit hosting platform

## External Dependencies

### Core Infrastructure
- **Supabase**: PostgreSQL database hosting, authentication services, and real-time subscriptions
- **Replit**: Application hosting platform and development environment

### Frontend Libraries
- **@supabase/supabase-js**: Official Supabase JavaScript client for database and auth operations
- **Google Fonts (Open Sans)**: Typography and font loading for consistent branding

### Backend Services
- **Express.js**: Web server framework for Node.js serving static files and API endpoints
- **Microsoft Graph Client**: Official Microsoft SDK for Outlook email integration
- **Node.js**: JavaScript runtime environment (v14.0.0+)

### Browser APIs
- **Web Storage API**: Session persistence and local data caching
- **Fetch API**: HTTP requests for database operations and authentication
- **DOM API**: Dynamic content manipulation and user interface updates