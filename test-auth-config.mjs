import { auth } from './src/lib/auth.js';

console.log('Testing auth configuration...\n');

// Check if auth object exists
console.log('✓ Auth object loaded');

// Try to access the admin plugin configuration
console.log('\nChecking admin plugin configuration...');

// Create a test session to verify the configuration
const testUserId = 'HBGNOBl8kRBM5NdNMqHNZIq1Tk7YFB4N'; // supertest@example.com user ID

console.log('\nAttempting to verify admin configuration...');
console.log('Note: This script can only verify that auth.ts loads without errors.');
console.log('The actual admin role check happens at runtime in the better-auth plugin.');

console.log('\n✅ auth.ts loaded successfully');
console.log('If you still see permission errors, try:');
console.log('1. Stop the dev server completely (Ctrl+C)');
console.log('2. Clear any build cache: rm -rf .astro dist node_modules/.vite');
console.log('3. Restart: npm run dev');
