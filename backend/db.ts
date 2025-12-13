interface DbRecord {
  id: string;
  [key: string]: any;
}

const API_BASE = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

async function dbRequest(method: string, path: string, body?: any) {
  const url = `${API_BASE}/${path}`;
  
  console.log(`[DB] ${method} ${url}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`,
      "X-Namespace": NAMESPACE || "default",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    console.error(`[DB] Error ${response.status}:`, await response.text());
    throw new Error(`Database error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    try {
      const result = await dbRequest("GET", `${collection}/${id}`);
      console.log(`[DB] GET ${collection}:${id}:`, result ? "Found" : "Not found");
      return result || null;
    } catch (error: any) {
      if (error.message?.includes("404")) {
        console.log(`[DB] GET ${collection}:${id}: Not found`);
        return null;
      }
      throw error;
    }
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    console.log(`[DB] SET ${collection}:${id}`);
    await dbRequest("PUT", `${collection}/${id}`, data);
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    console.log(`[DB] DELETE ${collection}:${id}`);
    await dbRequest("DELETE", `${collection}/${id}`);
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    try {
      const result = await dbRequest("GET", collection);
      const items = Array.isArray(result) ? result : (result?.items || []);
      console.log(`[DB] LIST ${collection}:`, items.length, "items");
      return items;
    } catch {
      console.log(`[DB] LIST ${collection}: Error, returning empty array`);
      return [];
    }
  },
};
