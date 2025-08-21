import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export default sql;
