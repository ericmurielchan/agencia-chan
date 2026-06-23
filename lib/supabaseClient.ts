import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isUrlValid = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

let tempSupabase: any;

if (supabaseUrl && supabaseAnonKey && isUrlValid(supabaseUrl)) {
  try {
    tempSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

if (!tempSupabase) {
  console.warn('Supabase is not configured or failed to initialize. Operating in offline/mock mode.');
  
  // Create a robust Proxy that prevents crashes on any property access or method chain
  tempSupabase = new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'from' || prop === 'channel') {
        return () => {
          return new Proxy({}, {
            get: (t, p) => {
              if (p === 'select' || p === 'insert' || p === 'update' || p === 'delete' || p === 'upsert' || p === 'on' || p === 'subscribe') {
                return () => {
                  const queryProxy: any = () => queryProxy;
                  queryProxy.then = (resolve: any) => resolve({ data: [], error: { message: 'Supabase client not initialized' } });
                  queryProxy.catch = (reject: any) => reject(new Error('Supabase client not initialized'));
                  queryProxy.eq = () => queryProxy;
                  queryProxy.neq = () => queryProxy;
                  queryProxy.gt = () => queryProxy;
                  queryProxy.lt = () => queryProxy;
                  queryProxy.gte = () => queryProxy;
                  queryProxy.lte = () => queryProxy;
                  queryProxy.like = () => queryProxy;
                  queryProxy.ilike = () => queryProxy;
                  queryProxy.is = () => queryProxy;
                  queryProxy.in = () => queryProxy;
                  queryProxy.contains = () => queryProxy;
                  queryProxy.containedBy = () => queryProxy;
                  queryProxy.range = () => queryProxy;
                  queryProxy.limit = () => queryProxy;
                  queryProxy.order = () => queryProxy;
                  queryProxy.single = () => queryProxy;
                  queryProxy.maybeSingle = () => queryProxy;
                  return queryProxy;
                };
              }
              if (p === 'then') return undefined;
              return () => {};
            }
          });
        };
      }
      return () => {};
    }
  });
}

export const supabase = tempSupabase;

