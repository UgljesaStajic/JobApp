import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[DB] ⚠️ CRITICAL: Missing Supabase configuration!');
  console.error('[DB] SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('[DB] SUPABASE_KEY:', supabaseKey ? '✓ Set (hidden)' : '✗ Missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

interface DbRecord {
  id: string;
  [key: string]: any;
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformKeysToSnakeCase);
  
  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = transformKeysToSnakeCase(obj[key]);
    }
  }
  return transformed;
}

function transformKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformKeysToCamelCase);
  
  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeysToCamelCase(obj[key]);
    }
  }
  return transformed;
}

export const db = {
  async get<T = any>(collection: string, id: string): Promise<T | null> {
    console.log(`[DB] 🔍 GET ${collection}/${id}`);
    
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[DB] ℹ️ Record not found: ${collection}/${id}`);
        return null;
      }
      console.error(`[DB] ⚠️ Error fetching ${collection}/${id}:`, error);
      return null;
    }
    
    console.log(`[DB] ✓ Found ${collection}/${id}`);
    return transformKeysToCamelCase(data) as T;
  },

  async set<T extends DbRecord>(collection: string, id: string, data: T): Promise<T> {
    console.log(`[DB] 💾 SET ${collection}/${id}`);
    
    const snakeCaseData = transformKeysToSnakeCase({ ...data, id });
    
    const { error } = await supabase
      .from(collection)
      .upsert(snakeCaseData, { onConflict: 'id' });
    
    if (error) {
      console.error(`[DB] ⚠️ Error setting ${collection}/${id}:`, error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
    
    console.log(`[DB] ✓ Saved ${collection}/${id}`);
    return data;
  },

  async delete(collection: string, id: string): Promise<boolean> {
    console.log(`[DB] 🗑️ DELETE ${collection}/${id}`);
    
    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`[DB] ⚠️ Error deleting ${collection}/${id}:`, error);
      return false;
    }
    
    console.log(`[DB] ✓ Deleted ${collection}/${id}`);
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    console.log(`[DB] 📋 LIST ${collection}`);
    
    const { data, error } = await supabase
      .from(collection)
      .select('*');
    
    if (error) {
      console.error(`[DB] ⚠️ Error listing ${collection}:`, error);
      return [];
    }
    
    console.log(`[DB] ✓ Listed ${collection}: ${data?.length || 0} items`);
    return (data || []).map(transformKeysToCamelCase) as T[];
  },
};
