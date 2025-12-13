const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

interface DbRecord {
  id: string;
  [key: string]: any;
}

async function dbRequest(method: string, path: string, body?: any): Promise<any> {
  if (!DB_ENDPOINT || !DB_TOKEN) {
    console.error("Database not configured");
    throw new Error("Database not configured");
  }

  const namespace = DB_NAMESPACE || 'default';
  const url = `${DB_ENDPOINT}/kv/${namespace}/keys${path}`;
  
  console.log(`[DB] ${method} ${url}`);
  console.log(`[DB] Namespace: ${namespace}`);
  console.log(`[DB] Path: ${path}`);
  console.log(`[DB] Endpoint: ${DB_ENDPOINT}`);
  console.log(`[DB] Token present: ${!!DB_TOKEN}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DB_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[DB] Error Response:`);
    console.error(`[DB] Status: ${response.status}`);
    console.error(`[DB] Response Text: ${text}`);
    console.error(`[DB] Full URL: ${url}`);
    console.error(`[DB] Method: ${method}`);
    console.error(`[DB] Headers:`, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DB_TOKEN?.substring(0, 10)}...`
    });
    throw new Error(`Database error: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    try {
      const result = await dbRequest("GET", `/${collection}/${id}`);
      return result as T;
    } catch {
      console.log(`[DB] Record not found: ${collection}/${id}`);
      return null;
    }
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    await dbRequest("PUT", `/${collection}/${id}`, data);
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    try {
      await dbRequest("DELETE", `/${collection}/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async list<T = any>(collection: string): Promise<T[]> {
    try {
      const result = await dbRequest("GET", `/${collection}`);
      if (Array.isArray(result)) return result as T[];
      if (result && typeof result === "object") {
        return Object.values(result) as T[];
      }
      return [];
    } catch {
      return [];
    }
  },
};
