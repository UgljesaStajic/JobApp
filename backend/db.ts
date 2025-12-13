interface DbRecord {
  id: string;
  [key: string]: any;
}

const API_BASE = (process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || "").replace(/\/$/, "");
const NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

type MemoryStore = Map<string, Map<string, any>>;
const memoryStore: MemoryStore = new Map();
let useMemoryStore = false;

function getCollection(store: MemoryStore, collection: string): Map<string, any> {
  if (!store.has(collection)) {
    store.set(collection, new Map());
  }
  return store.get(collection)!;
}

async function dbRequest(method: string, path: string, body?: any) {
  if (useMemoryStore) {
    return null;
  }

  if (!API_BASE || !NAMESPACE || !TOKEN) {
    console.warn("[DB] Missing configuration, using in-memory store");
    useMemoryStore = true;
    return null;
  }

  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  const url = `${API_BASE}/kv/${NAMESPACE}/key/${cleanPath}`;
  
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
      if (method === "GET") {
        console.log(`[DB] Key not found: ${cleanPath}`);
        return null;
      }
      console.warn(`[DB] Endpoint not available, switching to in-memory store`);
      useMemoryStore = true;
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Error ${response.status}:`, errorText);
      console.warn(`[DB] Switching to in-memory store due to error`);
      useMemoryStore = true;
      return null;
    }

    const text = await response.text();
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      console.log(`[DB] Response was not JSON:`, text);
      return text;
    }
  } catch (error: any) {
    console.error(`[DB] Request failed, using in-memory store:`, error.message);
    useMemoryStore = true;
    return null;
  }
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    if (useMemoryStore) {
      const col = getCollection(memoryStore, collection);
      const result = col.get(id);
      console.log(`[DB Memory] GET ${collection}/${id}:`, result ? 'found' : 'not found');
      return result || null;
    }

    const safeId = encodeURIComponent(id);
    const result = await dbRequest("GET", `${collection}/${safeId}`);
    
    if (useMemoryStore) {
      return this.get(collection, id);
    }
    
    return result || null;
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    if (useMemoryStore) {
      const col = getCollection(memoryStore, collection);
      col.set(id, data);
      console.log(`[DB Memory] SET ${collection}/${id}`);
      return data;
    }

    const safeId = encodeURIComponent(id);
    await dbRequest("PUT", `${collection}/${safeId}`, data);
    
    if (useMemoryStore) {
      return this.set(collection, id, data);
    }
    
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    if (useMemoryStore) {
      const col = getCollection(memoryStore, collection);
      const deleted = col.delete(id);
      console.log(`[DB Memory] DELETE ${collection}/${id}:`, deleted);
      return true;
    }

    const safeId = encodeURIComponent(id);
    await dbRequest("DELETE", `${collection}/${safeId}`);
    
    if (useMemoryStore) {
      return this.delete(collection, id);
    }
    
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    if (useMemoryStore) {
      const col = getCollection(memoryStore, collection);
      const result = Array.from(col.values());
      console.log(`[DB Memory] LIST ${collection}: ${result.length} items`);
      return result;
    }

    const result = await dbRequest("GET", collection);
    
    if (useMemoryStore) {
      return this.list(collection);
    }
    
    if (!result) return [];
    
    if (Array.isArray(result)) return result;
    if (result.items && Array.isArray(result.items)) return result.items;
    if (typeof result === 'object') {
      return Object.values(result);
    }
    
    return [];
  },
};
