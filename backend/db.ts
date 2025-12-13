interface DbRecord {
  id: string;
  [key: string]: any;
}

const API_BASE = (process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || "").replace(/\/$/, "");
const NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

async function dbRequest(method: string, path: string, body?: any) {
  if (!API_BASE || !NAMESPACE || !TOKEN) {
    console.error("[DB] Missing configuration:", { API_BASE, NAMESPACE: !!NAMESPACE, TOKEN: !!TOKEN });
    throw new Error("Database configuration missing");
  }

  // Ensure path doesn't start with /
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
      // For GET requests, 404 simply means key not found - return null
      if (method === "GET") {
        console.log(`[DB] Key not found: ${cleanPath}`);
        return null;
      }
      
      // For PUT/DELETE/POST, 404 means the endpoint itself is not found (Critical Error)
      const errorText = await response.text();
      console.error(`[DB] 404 Endpoint Not Found for ${method}:`, errorText);
      throw new Error(`Database endpoint not found (404). Check API configuration.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Error ${response.status}:`, errorText);
      throw new Error(`Database error: ${response.status} ${errorText}`);
    }

    const text = await response.text();
    // Handle empty responses (common for DELETE/PUT)
    if (!text) return null;
    
    try {
      return JSON.parse(text);
    } catch {
      console.log(`[DB] Response was not JSON:`, text);
      return text;
    }
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

  // Note: List might not be supported by all KV providers in this format
  async list<T = any>(collection: string): Promise<T[]> {
    const result = await dbRequest("GET", collection);
    if (!result) return [];
    
    if (Array.isArray(result)) return result;
    if (result.items && Array.isArray(result.items)) return result.items;
    if (typeof result === 'object') {
      return Object.values(result);
    }
    
    return [];
  },
};
