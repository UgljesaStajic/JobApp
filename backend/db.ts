const inMemoryStore = new Map<string, any>();

interface DbRecord {
  id: string;
  [key: string]: any;
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    const key = `${collection}:${id}`;
    const value = inMemoryStore.get(key);
    console.log(`[DB] GET ${key}:`, value ? "Found" : "Not found");
    return value || null;
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    const key = `${collection}:${id}`;
    console.log(`[DB] SET ${key}`);
    inMemoryStore.set(key, data);
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    const key = `${collection}:${id}`;
    console.log(`[DB] DELETE ${key}`);
    inMemoryStore.delete(key);
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    const results: T[] = [];
    const prefix = `${collection}:`;
    
    for (const [key, value] of inMemoryStore.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value);
      }
    }
    
    console.log(`[DB] LIST ${collection}:`, results.length, "items");
    return results;
  },
};
