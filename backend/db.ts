interface DbRecord {
  id: string;
  [key: string]: any;
}

const API_BASE = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

async function dbRequest(method: string, path: string, body?: any) {
  // Ensure path is properly encoded but allow slashes for key structure
  // path can be "collection/id" or just "collection"
  const url = `${API_BASE}/kv/${NAMESPACE}/key/${path}`;
  
  console.log(`[DB] ${method} ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 404) {
      console.log(`[DB] 404 Not Found: ${path}`);
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Error ${response.status}:`, errorText);
      throw new Error(`Database error: ${response.status} ${errorText}`);
    }

    // For DELETE or PUT usually returns success info, but sometimes empty
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    console.error(`[DB] Request failed: ${error.message}`);
    throw error;
  }
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    const safeId = encodeURIComponent(id);
    const result = await dbRequest("GET", `${collection}/${safeId}`);
    return result || null;
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    const safeId = encodeURIComponent(id);
    await dbRequest("PUT", `${collection}/${safeId}`, data);
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    const safeId = encodeURIComponent(id);
    await dbRequest("DELETE", `${collection}/${safeId}`);
    return true;
  },

  // Avoid using list if possible, as it might be slow or paginated
  async list<T = any>(collection: string): Promise<T[]> {
    const result = await dbRequest("GET", collection);
    if (!result) return [];
    
    // Handle different response formats (array or object with items)
    if (Array.isArray(result)) return result;
    if (result.items && Array.isArray(result.items)) return result.items;
    
    // If it returns an object of keys (common in some KV stores)
    if (typeof result === 'object') {
      return Object.values(result);
    }
    
    return [];
  },
};
