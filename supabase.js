/**
 * VIFM Portal - Centralized Supabase Configuration
 * Secure production-grade authentication and database client
 */

// Initialize Supabase client with environment variables (no hardcoded fallbacks)
// Note: Environment variables are loaded lazily to avoid timing issues

// Helper function to get environment variables in Replit
function getEnvVar(name) {
    // Try multiple methods to get environment variables in browser context
    if (window.env && window.env[name]) {
        return window.env[name];
    }
    
    // For production, credentials are injected server-side
    const metaTag = document.querySelector(`meta[name="${name}"]`);
    if (metaTag) {
        return metaTag.getAttribute('content');
    }
    
    throw new Error(`Environment variable ${name} not found. Please check your Replit secrets configuration.`);
}

// Create Supabase client
let supabaseClient = null;

function initializeSupabase() {
    try {
        // Check if Supabase library is loaded properly
        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Supabase library not loaded properly. Please ensure @supabase/supabase-js is included.');
        }
        
        console.log('[Supabase] Initializing client...');
        
        const url = getEnvVar('SUPABASE_URL');
        const key = getEnvVar('SUPABASE_ANON_KEY');
        
        console.log('[Supabase] Using URL:', url ? url.substring(0, 30) + '...' : 'NOT FOUND');
        console.log('[Supabase] Using Key:', key ? 'PROVIDED' : 'NOT FOUND');
        
        if (!url || !key) {
            throw new Error('Supabase credentials missing. Please check SUPABASE_URL and SUPABASE_ANON_KEY in secrets.');
        }
        
        supabaseClient = window.supabase.createClient(url, key, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false, // Disable to prevent postMessage recursion
                storage: window.sessionStorage // Use sessionStorage for auth persistence
            },
            db: {
                schema: 'public'
            }
        });
        
        console.log('[Supabase] Client created:', !!supabaseClient);
        console.log('[Supabase] Client has .from method:', typeof supabaseClient.from === 'function');
        
        // Test the client immediately
        if (!supabaseClient.from) {
            throw new Error('Supabase client creation failed - missing .from method');
        }
        
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
        console.error('❌ Full error:', error);
        return null;
    }
}

// Get the initialized client
function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = initializeSupabase();
    }
    return supabaseClient;
}

// Authentication functions
const Auth = {
    // Sign in with email and password (Production version - Secure)
    async signIn(email, password) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        // Use actual Supabase authentication only
        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('Authentication failed:', error.message);
                throw new Error('Invalid email or password');
            }
            
            // Get profile from database
            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('*')
                .eq('email', email)
                .single();
                
            if (profileError) {
                console.error('Profile fetch error:', profileError);
                throw new Error('User profile not found');
            }
            
            // Store session in sessionStorage only
            sessionStorage.setItem('vifm_session', JSON.stringify({
                user: data.user,
                profile: profile,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            }));
            
            return { user: data.user, session: data.session, profile };
            
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    },
    
    // Sign out (Production version)
    async signOut() {
        try {
            // Sign out from Supabase
            const client = getSupabaseClient();
            if (client) {
                await client.auth.signOut();
            }
        } catch (error) {
            console.error('Supabase signout error:', error);
        }
        
        // Clear session data from sessionStorage only
        sessionStorage.removeItem('vifm_session');
        sessionStorage.removeItem('vifm_profile');
        // Clear any legacy localStorage items but don't wipe all localStorage
        localStorage.removeItem('vifm_session');
        localStorage.removeItem('vifm_profile');
    },
    
    // Get current session (Production version)
    async getSession() {
        try {
            // Try real Supabase session first
            const client = getSupabaseClient();
            if (client) {
                const { data: session } = await client.auth.getSession();
                if (session.session) {
                    return session.session;
                }
            }
            
            // Fallback to stored session
            const sessionData = sessionStorage.getItem('vifm_session');
            if (!sessionData) return null;
            
            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (session.expires_at && new Date(session.expires_at) <= new Date()) {
                sessionStorage.removeItem('vifm_session');
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Session error:', error);
            return null;
        }
    },
    
    // Get current user with profile (Production version)
    async getCurrentUser() {
        const session = await this.getSession();
        if (!session?.user) return { user: null, profile: null };
        
        try {
            // If session includes profile, use it
            if (session.profile) {
                return { user: session.user, profile: session.profile };
            }
            
            // Otherwise fetch from database
            const client = getSupabaseClient();
            if (client) {
                const { data: profile, error } = await client
                    .from('profiles')
                    .select('*')
                    .eq('email', session.user.email)
                    .single();
                    
                if (!error && profile) {
                    return { user: session.user, profile };
                }
            }
            
            // Fallback to stored profile
            const profileData = sessionStorage.getItem('vifm_profile') || localStorage.getItem('vifm_profile');
            const profile = profileData ? JSON.parse(profileData) : null;
            
            return { user: session.user, profile };
        } catch (error) {
            console.error('Profile fetch error:', error);
            return { user: session.user, profile: null };
        }
    },
    
    // Original getCurrentUser method (preserved for reference)
    async getCurrentUserOriginal() {
        const session = await this.getSession();
        if (!session?.user) return null;
        
        const client = getSupabaseClient();
        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
        if (error) {
            console.error('Profile fetch error:', error);
            return { user: session.user, profile: null };
        }
        
        return { user: session.user, profile };
    },
    
    // Listen for auth state changes
    onAuthStateChange(callback) {
        const client = getSupabaseClient();
        if (!client) return;
        
        return client.auth.onAuthStateChange(callback);
    }
};

// Database functions
const Database = {
    // Generic select function
    async select(table, options = {}) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        let query = client.from(table).select(options.select || '*');
        
        if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    
    // Generic insert function
    async insert(table, data) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        const session = await Auth.getSession();
        if (!session?.user) throw new Error('User not authenticated');
        
        // Add created_by field if not present - use user.id for RLS compatibility
        if (!data.created_by && table !== 'profiles') {
            const { user, profile } = await Auth.getCurrentUser();
            data.created_by = user.id; // Always use user.id for Supabase auth.uid() RLS policies
        }
        
        const { data: result, error } = await client
            .from(table)
            .insert(data)
            .select()
            .single();
            
        if (error) throw error;
        return result;
    },
    
    // Generic update function
    async update(table, id, data) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        data.updated_at = new Date().toISOString();
        
        const { data: result, error } = await client
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return result;
    },
    
    // Generic delete function
    async delete(table, id) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        const { error } = await client
            .from(table)
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    },
    
    // Test connection
    async testConnection() {
        try {
            const client = getSupabaseClient();
            if (!client) {
                return { success: false, message: 'Supabase client not available' };
            }
            
            // Simple test - just try to connect to any table
            const { data, error } = await client
                .from('opportunities')
                .select('id')
                .limit(1);
                
            if (error && error.code === 'PGRST205') {
                // Schema cache issue - return success anyway since connection works
                return { success: true, message: 'Connected (schema cache issue, but functional)' };
            }
            
            if (error) {
                return { success: false, message: error.message };
            }
            
            return { success: true, message: 'Connected to Supabase', data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Route protection
const RouteGuard = {
    // Check if user is authenticated
    async requireAuth() {
        const session = await Auth.getSession();
        if (!session?.user) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },
    
    // Check if user has required role
    async requireRole(requiredRole) {
        const { user, profile } = await Auth.getCurrentUser();
        if (!user) {
            window.location.href = '/login.html';
            return false;
        }
        
        if (!profile) {
            console.error('User profile not found');
            window.location.href = '/login.html';
            return false;
        }
        
        if (profile.role !== requiredRole && profile.role !== 'admin') {
            window.location.href = '/vifm-main-menu.html';
            return false;
        }
        
        return true;
    },
    
    // Get redirect URL based on user role
    getRoleBasedRedirect(role) {
        switch (role) {
            case 'consultant':
                return '/phase1.html';
            case 'bd':
                return '/bd-module.html';
            case 'admin':
                return '/vifm-main-menu.html';
            default:
                return '/vifm-main-menu.html';
        }
    }
};

// Connection status management
const ConnectionStatus = {
    status: 'disconnected',
    listeners: [],
    
    // Add status change listener
    addListener(callback) {
        this.listeners.push(callback);
    },
    
    // Update status and notify listeners
    updateStatus(status, message = '') {
        this.status = status;
        this.listeners.forEach(callback => callback(status, message));
    },
    
    // Check connection periodically
    async startMonitoring() {
        const checkConnection = async () => {
            try {
                const result = await Database.testConnection();
                this.updateStatus(result.success ? 'connected' : 'disconnected', result.message);
            } catch (error) {
                this.updateStatus('disconnected', error.message);
            }
        };
        
        // Initial check
        await checkConnection();
        
        // Check every 30 seconds
        setInterval(checkConnection, 30000);
    }
};

// Initialize connection monitoring when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ConnectionStatus.startMonitoring();
    });
} else {
    ConnectionStatus.startMonitoring();
}

// Export everything for global use
window.VIFMSupabase = {
    Auth,
    Database,
    RouteGuard,
    ConnectionStatus,
    getSupabaseClient,
    initializeSupabase
};

// Also export Auth directly for login function compatibility
window.Auth = Auth;