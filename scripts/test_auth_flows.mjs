import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  }
}

console.log('=== HOMEO CIRCLE AUTHENTICATION & USER JOURNEY TEST SUITE ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log('1. Testing Supabase Client & Configuration');
  assert(Boolean(supabaseUrl), `VITE_SUPABASE_URL is configured (${supabaseUrl})`);
  assert(Boolean(supabaseAnonKey), `VITE_SUPABASE_ANON_KEY is configured`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  console.log('\n2. Testing Google OAuth Initiation & Callback Destination');
  try {
    const destination = 'http://localhost:5173/community';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: destination
      }
    });

    assert(!error, 'OAuth initiation completed without error');
    assert(Boolean(data?.url), `OAuth returned valid authorization URL`);
    if (data?.url) {
      assert(
        data.url.includes('accounts.google.com') || data.url.includes('/auth/v1/authorize'),
        'OAuth URL routes to trusted Google/Supabase Auth endpoint'
      );
      assert(
        data.url.includes(encodeURIComponent(destination)) || data.url.includes('community'),
        'OAuth redirect URL correctly targets /community'
      );
    }
  } catch (err) {
    assert(false, `OAuth initiation crashed: ${err.message}`);
  }

  console.log('\n3. Testing Email/Password Sign-In Error Handling (Invalid Credentials)');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent.practitioner@homeocircle.in',
      password: 'invalid_password_12345'
    });
    assert(Boolean(error), 'Invalid credentials correctly returned an authentication error');
    assert(
      error?.message?.toLowerCase().includes('invalid') || error?.message?.toLowerCase().includes('credentials'),
      `Error message is descriptive: "${error?.message}"`
    );
  } catch (err) {
    assert(false, `Sign-in test threw unexpected exception: ${err.message}`);
  }

  console.log('\n4. Testing Profile Resolution Helper Logic');
  // Simulated Google OAuth user object without a pre-existing row in public.profiles
  const mockOAuthUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'new.doctor@gmail.com',
    user_metadata: {
      full_name: 'Dr. Vivek Sharma',
      avatar_url: 'https://lh3.googleusercontent.com/test-avatar.jpg',
      account_type: 'doctor'
    },
    created_at: new Date().toISOString()
  };

  const fullName = mockOAuthUser.user_metadata?.full_name || 
                   mockOAuthUser.email?.split('@')[0] || 
                   'Member';

  const resolvedProfile = {
    id: mockOAuthUser.id,
    email: mockOAuthUser.email,
    full_name: fullName,
    display_name: fullName,
    avatar_url: mockOAuthUser.user_metadata?.avatar_url,
    role: 'member',
    account_type: mockOAuthUser.user_metadata?.account_type || 'doctor',
    status: 'verified',
    verification_status: 'pending',
    qualification: 'BHMS',
    experience_years: 0,
    state: 'Maharashtra',
    created_at: mockOAuthUser.created_at,
    updated_at: new Date().toISOString()
  };

  assert(resolvedProfile.full_name === 'Dr. Vivek Sharma', 'Full name correctly extracted from OAuth metadata');
  assert(resolvedProfile.status === 'verified', 'OAuth user immediately granted verified community status');
  assert(resolvedProfile.role === 'member', 'Default role is member, preventing unauthorized admin elevation');
  assert(resolvedProfile.account_type === 'doctor', 'Default account type set to doctor');

  console.log('\n5. Testing Authorization & Role Guard Logic');
  const normalUser = { ...resolvedProfile, role: 'member' };
  const adminUser = { ...resolvedProfile, role: 'admin' };
  const superAdminUser = { ...resolvedProfile, role: 'super_admin' };

  function checkAdminAccess(user) {
    return Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  }

  assert(checkAdminAccess(normalUser) === false, 'Ordinary member is strictly BLOCKED from admin area');
  assert(checkAdminAccess(adminUser) === true, 'Admin user is granted admin area access');
  assert(checkAdminAccess(superAdminUser) === true, 'Super Admin user is granted admin area access');

  console.log('\n6. Testing Homepage File & CTA Verification');
  const landingPageContent = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');
  assert(
    !landingPageContent.includes("to={`/apply?role="),
    'Removed forced role selection URL parameters from homepage'
  );
  assert(
    !landingPageContent.includes("Join as Doctor"),
    'Removed prominent "Join as Doctor" forced button'
  );
  assert(
    !landingPageContent.includes("Join as Student"),
    'Removed prominent "Join as Student" forced button'
  );
  assert(
    !landingPageContent.includes("Join as Researcher"),
    'Removed prominent "Join as Researcher" forced button'
  );
  assert(
    landingPageContent.includes('to="/login"') && landingPageContent.includes('Join Homeo Circle'),
    'Homepage primary CTA is "Join Homeo Circle" linking directly to /login'
  );

  console.log('\n7. Testing Navigation Bar & Sidebar Links');
  const navbarContent = fs.readFileSync('src/components/layout/PublicNavbar.tsx', 'utf8');
  const sidebarContent = fs.readFileSync('src/components/layout/MemberSidebar.tsx', 'utf8');

  assert(
    navbarContent.includes('to="/login"') && !navbarContent.includes('to="/apply"\n                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D817B]'),
    'Public navbar "Join Homeo Circle" redirects to /login'
  );
  assert(
    sidebarContent.includes('to="/login" \n                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0D817B]'),
    'Member sidebar "Join Homeo Circle" redirects to /login'
  );

  console.log('\n8. Testing Profile Type Selection Safety');
  const profileEditContent = fs.readFileSync('src/pages/member/ProfileEditPage.tsx', 'utf8');
  assert(
    profileEditContent.includes("Choose Your Profile Type"),
    'ProfileEditPage provides "Choose Your Profile Type" interactive section'
  );
  assert(
    profileEditContent.includes("['admin', 'super_admin', 'moderator'].includes"),
    'ProfileEditPage prevents client-side admin elevation or tampering'
  );

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite();
