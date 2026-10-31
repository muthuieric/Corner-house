const { Pool } = require('pg');
const conn = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jolaQwP1CG9x@ep-aged-firefly-b5d141gj-pooler.c-7.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
console.log('Connecting to:', conn);
const pool = new Pool({connectionString: conn, ssl: {rejectUnauthorized: false}});
pool.connect().then(client => {
  console.log('Connected!');
  client.query(
    "INSERT INTO parking_sessions (id, plate_number, status) VALUES ('fa28f2bd-50b2-438b-aa8e-d4b6c12d4673', 'KCD 123X', 'ACTIVE') ON CONFLICT (id) DO NOTHING",
    (err, res) => {
      if (err) {
        console.error('Error:', err.message);
      } else {
        console.log('✅ Session inserted');
      }
      client.end();
      process.exit(err ? 1 : 0);
    }
  );
}).catch(err => {
  console.error('Connect error:', err.message);
  process.exit(1);
});
