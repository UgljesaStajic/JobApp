interface DbRecord {
  id: string;
  [key: string]: any;
}

const API_BASE = (process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || "").replace(/\/$/, "");
const NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

// In-memory fallback store
const memoryStore = new Map<string, string>();

function getMemKey(collection: string, id: string) {
  return `${collection}::${id}`;
}

const IS_CONFIGURED = API_BASE && NAMESPACE && TOKEN;

if (!IS_CONFIGURED) {
  console.warn("[DB] Database configuration missing. Using in-memory fallback.");
}

async function dbRequest(method: string, path: string, body?: any) {
  if (!IS_CONFIGURED) {
    throw new Error("Using fallback");
  }

  // Ensure path doesn't start with /
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  const url = `${API_BASE}/kv/${NAMESPACE}/key/${cleanPath}`;
  
  // console.log(`[DB] ${method} ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      if (method === "GET") {
        return null;
      }
      // If PUT/POST/DELETE returns 404, it might mean the endpoint is wrong
      throw new Error(`Endpoint not found (404)`);
    }

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error: any) {
    console.warn(`[DB] Remote request failed (${method} ${path}): ${error.message}`);
    throw error;
  }
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    const memKey = getMemKey(collection, id);
    
    // Try remote first if configured
    if (IS_CONFIGURED) {
      try {
        const safeId = encodeURIComponent(id);
        const result = await dbRequest("GET", `${collection}/${safeId}`);
        
        // Sync to memory if found
        if (result) {
          memoryStore.set(memKey, JSON.stringify(result));
          return result;
        }
      } catch {
        // Fallback to memory on error
      }
    }

    // Fallback to memory
    const memData = memoryStore.get(memKey);
    return memData ? JSON.parse(memData) : null;
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    const memKey = getMemKey(collection, id);
    
    // Always save to memory first (optimistic)
    memoryStore.set(memKey, JSON.stringify(data));

    if (IS_CONFIGURED) {
      try {
        const safeId = encodeURIComponent(id);
        await dbRequest("PUT", `${collection}/${safeId}`, data);
      } catch (e) {
        console.warn(`[DB] Failed to sync set to remote: ${e}`);
        // We suppress the error because we saved to memory
      }
    }

    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    const memKey = getMemKey(collection, id);
    memoryStore.delete(memKey);

    if (IS_CONFIGURED) {
      try {
        const safeId = encodeURIComponent(id);
        await dbRequest("DELETE", `${collection}/${safeId}`);
      } catch (e) {
        console.warn(`[DB] Failed to sync delete to remote: ${e}`);
      }
    }
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    // This is a naive implementation for memory store
    // It scans all keys. In a real KV, list is different.
    const items: T[] = [];
    
    // First try remote
    if (IS_CONFIGURED) {
      try {
        const result = await dbRequest("GET", collection);
        if (result) {
           if (Array.isArray(result)) return result;
           if (result.items && Array.isArray(result.items)) return result.items;
           if (typeof result === 'object') return Object.values(result);
        }
      } catch (e) {
        console.warn(`[DB] Remote list failed, falling back to memory scan: ${e}`);
      }
    }

    // Memory fallback scan (inefficient but works for small datasets)
    for (const [key, value] of memoryStore.entries()) {
      if (key.startsWith(`${collection}::`)) {
        items.push(JSON.parse(value));
      }
    }
    
    return items;
  },
};
