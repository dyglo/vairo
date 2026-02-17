# Quick Start - Environment Variables

## 🚀 Get Started in 3 Steps

### Step 1: Copy the Example File
```bash
cp .env.example .env
```

### Step 2: Fill in Your Credentials

Edit `.env` and add your actual values:

```env
# Get from Supabase Project Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Generate a secure random string
JWT_SECRET=generate-secure-random-string-here

# Your API endpoint
API_BASE_URL=http://localhost:3000
```

### Step 3: Start the App
```bash
npm run dev
```

## 📋 Where to Get Credentials

### Supabase
1. Go to [supabase.com](https://supabase.com) → Your Project
2. Click **Settings** → **API**
3. Copy `Project URL` and `Anon Key` (not the Service Role Key)

### JWT Secret
Generate using:
```bash
openssl rand -base64 32
```

Or use: https://generate-random.org/?type=base64&length=32

## ⚠️ Important

- ✅ **DO** modify `.env` with your credentials
- ✅ **DO** keep `.env` in `.gitignore` 
- ❌ **DON'T** commit `.env` to git
- ❌ **DON'T** share `.env` file via email/chat
- ❌ **DON'T** commit real credentials

## 🆘 Troubleshooting

**Error: "Environment variables not configured"**
→ Make sure `.env` file exists with all required values

**Error: "EXPO_PUBLIC_SUPABASE_URL is not configured"**
→ Check that `EXPO_PUBLIC_SUPABASE_URL` is set in `.env`

**Error: "JWT_SECRET contains placeholder text"**
→ Replace `your_jwt_secret_key_here` with an actual secure value

## 📚 More Info

- Full setup guide: See [ENV_SETUP.md](ENV_SETUP.md)
- Refactoring details: See [ENVIRONMENT_REFACTORING.md](ENVIRONMENT_REFACTORING.md)
