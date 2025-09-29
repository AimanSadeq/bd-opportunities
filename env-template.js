// VIFM Environment Configuration Template
// This file should be copied to env.js and populated with actual credentials during deployment
// DO NOT commit env.js with real credentials

window.env = {
    // Replace these values during deployment:
    SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
    
    // Deployment metadata
    ENVIRONMENT: 'production',
    VERSION: '1.0.0',
    BUILD_DATE: new Date().toISOString()
};

console.log('✅ VIFM Environment Configuration Loaded');