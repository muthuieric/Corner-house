import { Pool } from "pg";
import { neon } from "@neondatabase/serverless";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Set it to your Neon PostgreSQL connection string."
      );
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  return neon(connectionString);
}

export async function executeQuery(text: string, params?: unknown[]) {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function executeTransaction(
  queries: Array<{ text: string; params?: unknown[] }>
) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (const q of queries) {
      const res = await client.query(q.text, q.params || []);
      results.push(res);
    }
    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type DbQueryResult<T = any> = {
  data: T | null;
  error: { code?: string; message: string; details?: string } | null;
  count?: number;
};

export class NeonQueryBuilder<T = any> implements PromiseLike<DbQueryResult<T[]>> {
  private table: string;
  private queryType: "select" | "insert" | "update" | "upsert" = "select";
  private selectedColumns: string = "*";
  private countOption: string | null = null;
  private headOption: boolean = false;
  private conditions: string[] = [];
  private params: unknown[] = [];
  private updateValues: Record<string, unknown> | null = null;
  private insertValues: Array<Record<string, unknown>> | null = null;
  private upsertConflict: string = "id";
  private orderByClause: string | null = null;
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.queryType !== "insert" && this.queryType !== "update" && this.queryType !== "upsert") {
      this.queryType = "select";
    }
    this.selectedColumns = columns;
    if (options?.count) this.countOption = options.count;
    if (options?.head) this.headOption = options.head;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.queryType = "update";
    this.updateValues = values;
    return this;
  }

  insert(values: Record<string, unknown> | Array<Record<string, unknown>>) {
    this.queryType = "insert";
    this.insertValues = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(
    values: Record<string, unknown> | Array<Record<string, unknown>>,
    options?: { onConflict?: string }
  ) {
    this.queryType = "upsert";
    this.insertValues = Array.isArray(values) ? values : [values];
    if (options?.onConflict) this.upsertConflict = options.onConflict;
    return this;
  }

  eq(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" = $${this.params.length}`);
    return this;
  }

  neq(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" != $${this.params.length}`);
    return this;
  }

  gte(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" >= $${this.params.length}`);
    return this;
  }

  lte(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" <= $${this.params.length}`);
    return this;
  }

  gt(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" > $${this.params.length}`);
    return this;
  }

  lt(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" < $${this.params.length}`);
    return this;
  }

  like(column: string, pattern: string) {
    this.params.push(pattern);
    this.conditions.push(`"${column}" LIKE $${this.params.length}`);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.params.push(pattern);
    this.conditions.push(`"${column}" ILIKE $${this.params.length}`);
    return this;
  }

  is(column: string, value: unknown) {
    if (value === null) {
      this.conditions.push(`"${column}" IS NULL`);
    } else {
      this.params.push(value);
      this.conditions.push(`"${column}" IS $${this.params.length}`);
    }
    return this;
  }

  in(column: string, values: unknown[]) {
    this.params.push(values);
    this.conditions.push(`"${column}" = ANY($${this.params.length})`);
    return this;
  }

  or(filterString: string) {
    if (!filterString) return this;
    const parts = filterString.split(",").map((p) => p.trim()).filter(Boolean);
    const subConds: string[] = [];
    for (const part of parts) {
      const match = part.match(/^([a-zA-Z0-9_]+)\.(eq|neq|gte|lte|gt|lt|like|ilike)\.(.*)$/);
      if (match) {
        const [, col, op, rawVal] = match;
        const val = rawVal === "null" ? null : rawVal;
        this.params.push(val);
        const idx = this.params.length;
        const opMap: Record<string, string> = {
          eq: "=",
          neq: "!=",
          gte: ">=",
          lte: "<=",
          gt: ">",
          lt: "<",
          like: "LIKE",
          ilike: "ILIKE",
        };
        subConds.push(`"${col}" ${opMap[op]} $${idx}`);
      }
    }
    if (subConds.length > 0) {
      this.conditions.push(`(${subConds.join(" OR ")})`);
    }
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const dir = options.ascending === false ? "DESC" : "ASC";
    this.orderByClause = `ORDER BY "${column}" ${dir}`;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private buildSql(): { sql: string; params: unknown[] } {
    const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(" AND ")}` : "";
    const orderClause = this.orderByClause || "";
    const limitClause = this.limitCount !== null ? `LIMIT ${this.limitCount}` : "";

    if (this.queryType === "select") {
      if (this.headOption) {
        return {
          sql: `SELECT COUNT(*) AS exact_count FROM "${this.table}" ${whereClause}`,
          params: this.params,
        };
      }
      const rawCols =
        this.selectedColumns === "*"
          ? "*"
          : this.selectedColumns
              .split(",")
              .map((c) => {
                const clean = c.trim();
                if (clean.includes("(") || clean.includes(" AS ") || clean.includes(" as ")) return clean;
                return `"${clean}"`;
              })
              .join(", ");

      const sql = `SELECT ${rawCols} FROM "${this.table}" ${whereClause} ${orderClause} ${limitClause}`.trim();
      return { sql, params: this.params };
    }

    if (this.queryType === "update") {
      const setClauses: string[] = [];
      for (const [key, val] of Object.entries(this.updateValues || {})) {
        const paramVal =
          val !== undefined && typeof val === "object" && val !== null && !(val instanceof Date)
            ? JSON.stringify(val)
            : val;
        this.params.push(paramVal);
        setClauses.push(`"${key}" = $${this.params.length}`);
      }
      const sql = `UPDATE "${this.table}" SET ${setClauses.join(", ")} ${whereClause} RETURNING *`.trim();
      return { sql, params: this.params };
    }

    if (this.queryType === "insert") {
      const rows = this.insertValues || [];
      if (rows.length === 0) throw new Error("No values to insert");
      const keys = Object.keys(rows[0]);
      const colNames = keys.map((k) => `"${k}"`).join(", ");
      const rowPlaceholders: string[] = [];

      for (const row of rows) {
        const phs: string[] = [];
        for (const k of keys) {
          const val = row[k];
          const paramVal =
            val !== undefined && typeof val === "object" && val !== null && !(val instanceof Date)
              ? JSON.stringify(val)
              : val;
          this.params.push(paramVal);
          phs.push(`$${this.params.length}`);
        }
        rowPlaceholders.push(`(${phs.join(", ")})`);
      }

      const sql = `INSERT INTO "${this.table}" (${colNames}) VALUES ${rowPlaceholders.join(", ")} RETURNING *`.trim();
      return { sql, params: this.params };
    }

    if (this.queryType === "upsert") {
      const rows = this.insertValues || [];
      if (rows.length === 0) throw new Error("No values to upsert");
      const keys = Object.keys(rows[0]);
      const colNames = keys.map((k) => `"${k}"`).join(", ");
      const phs: string[] = [];

      for (const k of keys) {
        const val = rows[0][k];
        const paramVal =
          val !== undefined && typeof val === "object" && val !== null && !(val instanceof Date)
            ? JSON.stringify(val)
            : val;
        this.params.push(paramVal);
        phs.push(`$${this.params.length}`);
      }

      const conflictCols = this.upsertConflict
        .split(",")
        .map((c) => `"${c.trim()}"`)
        .join(", ");
      const updateCols = keys
        .filter((k) => !this.upsertConflict.includes(k))
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(", ");

      const doAction = updateCols ? `DO UPDATE SET ${updateCols}` : `DO NOTHING`;
      const sql = `INSERT INTO "${this.table}" (${colNames}) VALUES (${phs.join(", ")}) ON CONFLICT (${conflictCols}) ${doAction} RETURNING *`.trim();
      return { sql, params: this.params };
    }

    throw new Error(`Unsupported query type: ${this.queryType}`);
  }

  async execute(): Promise<DbQueryResult<T[]>> {
    try {
      const { sql, params } = this.buildSql();
      const res = await executeQuery(sql, params);
      if (this.headOption) {
        return {
          data: null,
          error: null,
          count: parseInt(res.rows[0]?.exact_count || "0", 10),
        };
      }
      return {
        data: (res.rows as T[]) || [],
        error: null,
        count: res.rowCount ?? res.rows.length,
      };
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string; detail?: string };
      return {
        data: null,
        error: {
          code: errorObj.code || "UNKNOWN",
          message: errorObj.message || "Query execution failed",
          details: errorObj.detail,
        },
        count: 0,
      };
    }
  }

  then<TResult1 = DbQueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DbQueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single(): Promise<DbQueryResult<T>> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    if (!res.data || res.data.length === 0) {
      return {
        data: null,
        error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
      };
    }
    return { data: res.data[0], error: null };
  }

  async maybeSingle(): Promise<DbQueryResult<T>> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    return { data: res.data?.[0] || null, error: null };
  }
}

export function createNeonAdmin() {
  return {
    from: <T = any>(table: string) => new NeonQueryBuilder<T>(table),
    rpc: async (functionName: string, params?: unknown[]) => {
      const placeholders = params ? params.map((_, i) => `$${i + 1}`).join(", ") : "";
      const sql = `SELECT * FROM ${functionName}(${placeholders})`;
      const res = await executeQuery(sql, params || []);
      return { data: res.rows, error: null };
    },
    auth: {
      getUser: async (_token: string) => ({
        data: { user: null },
        error: new Error("Neon DB does not manage auth directly"),
      }),
    },
  };
}

export type { Pool };
