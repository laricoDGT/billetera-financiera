import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            envVars[key] = value;
        }
    }
});

console.log('DATABASE_URL found:', envVars.DATABASE_URL ? 'Yes' : 'No');
console.log('DATABASE_URL format:', envVars.DATABASE_URL ? envVars.DATABASE_URL.substring(0, 30) + '...' : 'N/A');

// Test connection with SSL
const pool = new Pool({
    connectionString: envVars.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        console.log('\n--- Testing database connection ---');
        const client = await pool.connect();
        console.log('✓ Successfully connected to database!');

        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✓ Query executed successfully');
        console.log('Current time:', result.rows[0].current_time);
        console.log('PostgreSQL version:', result.rows[0].pg_version);

        // Check if better-auth tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%user%' OR table_name LIKE '%session%'
            ORDER BY table_name
        `);

        console.log('\n--- Database tables ---');
        if (tablesResult.rows.length > 0) {
            console.log('Found tables:', tablesResult.rows.map(r => r.table_name).join(', '));
        } else {
            console.log('⚠ No user/session tables found. Better-auth may need to create them.');
        }

        client.release();
    } catch (err) {
        console.error('\n✗ Database connection error:');
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('\nFull error:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
