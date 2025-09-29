/**
 * VIFM Universal Route Guards
 * Enforces authentication and role-based access control on all protected pages
 */

window.VIFMRouteGuards = {
    
    // Public pages that don't require authentication
    PUBLIC_PAGES: ['login.html', 'index.html'],
    
    // Initialize route guard system
    async init() {
        console.log('🛡️ Initializing VIFM Route Guards...');
        
        // Check if current page should be protected
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (this.PUBLIC_PAGES.includes(currentPage)) {
            console.log('📖 Public page access allowed:', currentPage);
            return true;
        }
        
        // All other pages require authentication
        return await this.requireAuthentication();
    },
    
    // Require valid authentication session
    async requireAuthentication() {
        try {
            if (!window.VIFMSupabase?.Auth) {
                throw new Error('Authentication system not available');
            }
            
            const session = await window.VIFMSupabase.Auth.getSession();
            
            if (!session) {
                console.log('❌ No authentication session found');
                this.redirectToLogin('Authentication required');
                return false;
            }
            
            // Check session expiry (expires_at is in seconds, convert to milliseconds)
            const now = Date.now();
            const expiresAt = new Date(session.expires_at * 1000).getTime();
            if (now >= expiresAt) {
                console.log('❌ Session expired');
                await window.VIFMSupabase.Auth.signOut();
                this.redirectToLogin('Session expired - please log in again');
                return false;
            }
            
            // Get user profile
            const { user, profile } = await window.VIFMSupabase.Auth.getCurrentUser();
            if (!profile) {
                console.log('❌ No user profile found');
                this.redirectToLogin('Profile not found');
                return false;
            }
            
            console.log('✅ Authentication verified for:', profile.full_name);
            return { session, user, profile };
            
        } catch (error) {
            console.error('❌ Authentication guard error:', error);
            this.redirectToLogin('Authentication error - please log in');
            return false;
        }
    },
    
    // Require specific role access
    async requireRole(requiredRole) {
        try {
            const authResult = await this.requireAuthentication();
            if (!authResult) return false;
            
            const userRole = authResult.profile.role;
            
            // Admin has access to everything
            if (userRole === 'admin') {
                console.log('✅ Admin access granted');
                return true;
            }
            
            // Check specific role requirement
            if (userRole === requiredRole) {
                console.log(`✅ Role access granted: ${requiredRole}`);
                return true;
            }
            
            // Access denied
            console.log(`❌ Access denied: required ${requiredRole}, user has ${userRole}`);
            this.redirectToMainMenu(`Access denied. This page requires ${requiredRole} access.`);
            return false;
            
        } catch (error) {
            console.error('❌ Role guard error:', error);
            this.redirectToLogin('Authorization error');
            return false;
        }
    },
    
    // Redirect to login with message
    redirectToLogin(message) {
        console.log('🔄 Redirecting to login:', message);
        
        // Stop page rendering
        this.stopPageRendering();
        
        // Show message and redirect
        if (message) {
            sessionStorage.setItem('login_message', message);
        }
        
        // Force redirect
        window.location.replace('login.html');
    },
    
    // Redirect to main menu with message
    redirectToMainMenu(message) {
        console.log('🔄 Redirecting to main menu:', message);
        
        // Stop page rendering
        this.stopPageRendering();
        
        // Show message
        if (message) {
            alert(message);
        }
        
        // Force redirect
        window.location.replace('vifm-main-menu.html');
    },
    
    // Stop page rendering and show loading message
    stopPageRendering() {
        // Hide page content immediately
        if (document.body) {
            document.body.style.display = 'none';
        }
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #010131 0%, #121140 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Open Sans', Arial, sans-serif;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🔐</div>
                <h2 style="margin-bottom: 0.5rem;">Verifying Access...</h2>
                <p style="opacity: 0.8;">Please wait while we redirect you.</p>
            </div>
        `;
        
        document.documentElement.appendChild(overlay);
    }
};

// Universal Pre-render Security System - Updated Version
window.VIFMRouteGuards.executePreRenderSecurity = async function(requiredRole = null) {
    console.log('🛡️ Executing immediate pre-render security check...');
    
    try {
        // Wait for dependencies with timeout
        let attempts = 0;
        while ((!window.env || !window.VIFMSupabase) && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        
        if (!window.env || !window.VIFMSupabase) {
            throw new Error('Required dependencies not loaded');
        }
        
        // Get current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Skip auth for public pages
        if (this.PUBLIC_PAGES.includes(currentPage)) {
            this.resumePageRendering();
            return true;
        }
        
        // Check authentication for protected pages
        const currentUserResult = await window.VIFMSupabase.Auth.getCurrentUser();
        if (!currentUserResult) {
            this.redirectToLogin('Authentication required');
            return false;
        }
        
        const { user, profile } = currentUserResult;
        if (!user || !profile) {
            this.redirectToLogin('Authentication required');
            return false;
        }
        
        // Role-based access control if required
        if (requiredRole) {
            const hasAccess = (profile.role === requiredRole || profile.role === 'admin');
            if (!hasAccess) {
                alert(`Access denied. This page requires ${requiredRole.toUpperCase()} access.`);
                this.redirectToMainMenu();
                return false;
            }
        }
        
        // Authentication successful
        console.log('✅ Pre-render security passed for:', profile.full_name);
        this.resumePageRendering();
        return true;
        
    } catch (error) {
        console.error('❌ Pre-render security failed:', error);
        this.redirectToLogin('System error');
        return false;
    }
};

// Resume page rendering after successful authentication
window.VIFMRouteGuards.resumePageRendering = function() {
    // Show page content
    document.body.style.visibility = 'visible';
    
    // Remove loading overlay
    const overlay = document.querySelector('.auth-loading');
    if (overlay) {
        overlay.remove();
    }
    
    console.log('✅ Page rendering resumed');
};

console.log('🛡️ VIFM Route Guards loaded');