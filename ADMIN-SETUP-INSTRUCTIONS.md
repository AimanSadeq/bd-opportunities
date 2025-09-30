# Admin Account Setup Instructions

## 🔐 How to Set Up Your Admin Account

Since your portal now uses **real authentication** (no bypasses), you need to create your admin authentication account. Here are your options:

### **Option 1: Register Through the Portal (Recommended)**

1. **Go to `/login.html`**
2. **Click "Create an account"** tab
3. **Fill in your details:**
   - Email: `asadeq@viftraining.com`
   - Password: Choose a strong password (min 8 characters)
   - Role: Select "Consultant" (we'll upgrade to admin in step 4)
4. **After registration, manually upgrade your role to admin:**
   - Go to your Supabase Dashboard
   - Navigate to **Table Editor** → **profiles**
   - Find your account (`asadeq@viftraining.com`)
   - Change `role` from `consultant` to `admin`
5. **Log out and log back in** to see admin features

### **Option 2: Use Supabase Dashboard Directly**

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication** → **Users**
3. **Click "Add user"**
   - Email: `asadeq@viftraining.com`
   - Password: Choose a strong password
   - Auto Confirm User: **✓ Yes**
4. **Go to Table Editor** → **profiles**
5. **Verify your profile exists** with `role = 'admin'`
   - If not, insert a new row:
     - email: `asadeq@viftraining.com`
     - full_name: `Asadeq`
     - role: `admin`

### **Option 3: Use Password Reset**

If a profile already exists for `asadeq@viftraining.com`:

1. **Go to `/login.html`**
2. **Click "Forgot password?"**
3. **Enter:** `asadeq@viftraining.com`
4. **Check your email** for password reset link
5. **Follow the link** to set a new password
6. **Return to login** and use your new password

---

## 📋 Managing Other Employee Accounts

Once you've logged in as admin, you can:

### **Reset User Passwords**
1. **Go to Dashboard** → **User Management** module
2. **Click "Reset Password"** next to any user
3. **They'll receive an email** with reset instructions

### **View All Users**
- The User Management panel shows all employee profiles
- You can see their roles and contact information

---

## 🔒 Security Note

- **No more bypass logins** - All authentication now requires real Supabase credentials
- **RLS policies** will be enabled in Option C for additional database security
- **Service keys** are kept secure on the server (not in browser code)

---

## ✅ What's Working Now

- ✅ Real Supabase email/password authentication
- ✅ Role-based access control
- ✅ Password reset functionality
- ✅ Admin user management panel
- ✅ Secure session management

## 🚀 Next Steps

After you set up your admin account:
1. Test the login flow
2. Access the User Management panel
3. When ready, ask for **Option B: Deploy to Production** or **Option C: Security Hardening**
