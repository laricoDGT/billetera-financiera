import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon usually requires SSL, let's try to detect if we need to force it
    // ssl: { rejectUnauthorized: false } // Uncomment if needed
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log("Successfully connected to the database!");
        const res = await client.query('SELECT NOW()');
        console.log("Current time from DB:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Database connection error:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
