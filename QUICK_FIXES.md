# 🔐 Quick Security Fixes - HR-WEBAPP

## 1️⃣ CRITICAL: Rotated AUTH_SECRET

**Replace in `.env`:**
```bash
# ❌ OLD (WEAK)
AUTH_SECRET="5002f404-c08f-46c7-a30c-eae71821522a"

# Generate new secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ✅ NEW (STRONG) - Use the output from above
AUTH_SECRET="your-generated-32-byte-hex-string"
```

---

## 2️⃣ HIGH: Add File Upload Validation

**File: `src/app/api/staff/import/route.ts`**

Add at the top of the POST handler:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Inside POST function, after getting formData:
const file = formData.get('file') as File;

if (!file) {
  return NextResponse.json({ error: "No file provided" }, { status: 400 });
}

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `File too large. Maximum 5MB allowed. Got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
    { status: 400 }
  );
}

const validMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

if (!validMimeTypes.includes(file.type)) {
  return NextResponse.json(
    { error: `Invalid file type. Only Excel files allowed. Got: ${file.type}` },
    { status: 400 }
  );
}
```

---

## 3️⃣ HIGH: Add Rate Limiting to Login

**Install package:**
```bash
npm install express-rate-limit
```

**File: `src/app/api/auth/login/route.ts`**

Add this above the export:
```typescript
import { RateLimit } from 'express-rate-limit';

const loginAttempts: Record<string, { count: number; resetTime: number }> = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts[email];

  if (!attempt || now > attempt.resetTime) {
    loginAttempts[email] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return true;
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempt.count++;
  return true;
}

// Then in POST function, right after getting email:
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    // ✅ ADD THIS CHECK
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // ... rest of existing code
```

---

## 4️⃣ MEDIUM: Add Security Headers

**File: `next.config.ts`**

Update or create with:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-UA-Compatible",
            value: "IE=edge",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 5️⃣ MEDIUM: Add HTTPS Redirect (Production Only)

**File: `middleware.ts`**

Add before the auth check:
```typescript
// Force HTTPS in production
if (
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL !== "1" && // Skip on Vercel (handles it automatically)
  request.headers.get("x-forwarded-proto") !== "https"
) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  return NextResponse.redirect(url);
}
```

---

## 6️⃣ LOW: Add Environment Variable Validation

**File: `src/lib/auth.ts`**

Add at the top (before exports):
```typescript
// Validate environment on startup
if (!process.env.AUTH_SECRET) {
  throw new Error("FATAL: AUTH_SECRET environment variable is not set");
}

// Warn if using weak secret format (UUID)
if (process.env.AUTH_SECRET.length < 32) {
  console.warn(
    "⚠️  WARNING: AUTH_SECRET is too short. Should be at least 32 characters (64 hex digits)."
  );
}
```

---

## Testing Checklist ✅

```bash
# 1. Test authentication
npm run dev
# Try login - should work

# 2. Test rate limiting
# Try logging in with wrong password 5+ times
# Should get "Too many login attempts" on 6th attempt

# 3. Test file upload
# Try uploading a file > 5MB
# Should be rejected

# 4. Check headers in production
# curl -I https://your-domain.com
# Should see all security headers

# 5. Run build to catch errors
npm run build

# 6. Check for any env issues
npm run dev
# Watch console for AUTH_SECRET warnings
```

---

## Before Deploying to Production 🚀

1. ✅ Update AUTH_SECRET
2. ✅ Add file upload validation
3. ✅ Add rate limiting
4. ✅ Add security headers
5. ✅ Test all changes locally
6. ✅ Run `npm run build` successfully
7. ✅ Set environment variables in platform (Vercel/Railway/etc)
8. ✅ Enable HTTPS (automatic on most platforms)
9. ✅ Set up monitoring/logging
10. ✅ Test login and file upload in production

---

## Security Environment Variables Needed for Production

### Vercel
Go to: Settings → Environment Variables

```
DATABASE_URL  = [your-neon-db-url]
DIRECT_URL    = [your-neon-direct-url]
AUTH_SECRET   = [new-strong-secret]
NODE_ENV      = production
```

### Railway
Go to: Variables in service settings

Same as above

### DigitalOcean App Platform
Edit app spec and add under `env`:

```yaml
- key: DATABASE_URL
  value: [your-neon-db-url]
- key: DIRECT_URL
  value: [your-neon-direct-url]
- key: AUTH_SECRET
  value: [new-strong-secret]
- key: NODE_ENV
  value: production
```

---

## Monitoring Recommendations

Add error tracking service (pick one):
- **Sentry.io** (Free tier available, 5,000 errors/month)
- **Vercel Analytics** (Included if using Vercel)
- **LogRocket** (Session replay + error tracking)

---

**Questions?** Re-read `SECURITY_AUDIT.md` for full details.
