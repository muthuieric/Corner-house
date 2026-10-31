const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_jolaQwP1CG9x@ep-aged-firefly-b5d141gj-pooler.c-7.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: { rejectUnauthorized: false }
});
pool.connect().then(async client => {
  try {
    await client.query("INSERT INTO parking_sessions (plate_number, status) VALUES ('KCD 123X', 'ACTIVE')");
    console.log("SUCCESS: Inserted KCD 123X into parking_sessions");
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    await client.end();
    process.exit(1);
  }
}).catch(err => {
  console.error("CONNECTION ERROR:", err.message);
  process.exit(1);
});