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
        if (!window.supabase) {
            throw new Error('Supabase library not loaded. Please ensure @supabase/supabase-js is included.');
        }
        
        const url = getEnvVar('SUPABASE_URL');
        const key = getEnvVar('SUPABASE_ANON_KEY');
        
        if (!url || !key) {
            throw new Error('Supabase credentials missing. Please check SUPABASE_URL and SUPABASE_ANON_KEY in secrets.');
        }
        supabaseClient = window.supabase.createClient(url, key, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
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
    // Sign in with email and password
    async signIn(email, password) {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return data;
    },
    
    // Sign out
    async signOut() {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not available');
        
        const { error } = await client.auth.signOut();
        if (error) throw error;
        
        // Clear any remaining localStorage data
        localStorage.clear();
    },
    
    // Get current session
    async getSession() {
        const client = getSupabaseClient();
        if (!client) return null;
        
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        return session;
    },
    
    // Get current user with profile
    async getCurrentUser() {
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
        
        // Add created_by field if not present
        if (!data.created_by && table !== 'profiles') {
            const { user, profile } = await Auth.getCurrentUser();
            data.created_by = profile?.id || user.id;
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
            const data = await this.select('profiles', { limit: 1 });
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