import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../lib/storage';

export function useSupabaseClient(initialUrl: string, initialKey: string) {
  const [supabaseUrl, setSupabaseUrl] = useState(initialUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialKey);
  
  const [supabase, setSupabase] = useState<SupabaseClient | null>(() => {
    const url = supabaseConfig.getUrl() || initialUrl;
    const key = supabaseConfig.getKey() || initialKey;
    if (url && key) {
      try {
        return createClient(url.trim(), key.trim());
      } catch (err) {
        console.error('Supabase initialization failed:', err);
      }
    }
    return null;
  });

  // Sync props changes to internal state
  useEffect(() => {
    if (initialUrl && initialUrl !== supabaseUrl) {
      setSupabaseUrl(initialUrl);
    }
    if (initialKey && initialKey !== supabaseAnonKey) {
      setSupabaseAnonKey(initialKey);
    }
  }, [initialUrl, initialKey]);

  // Dynamically re-initialize Supabase client when credentials update
  useEffect(() => {
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();

    if (trimmedUrl && trimmedKey) {
      try {
        const client = createClient(trimmedUrl, trimmedKey);
        setSupabase(client);
        
        try {
          supabaseConfig.save(trimmedUrl, trimmedKey);
        } catch (storageErr) {
          console.warn('Failed to save Supabase config to localStorage (Private Window?):', storageErr);
        }
      } catch (err) {
        console.error('Dynamic Supabase re-initialization failed:', err);
        setSupabase(null);
      }
    } else {
      setSupabase(null);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  const saveSupabaseConfig = useCallback((onSuccess: (msg: string) => void, onError: (msg: string) => void) => {
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();
    
    if (!trimmedUrl || !trimmedKey) {
      onError('Supabase URL と Anon Key を両方とも入力してください');
      return;
    }
    try {
      const client = createClient(trimmedUrl, trimmedKey);
      setSupabase(client);
      
      try {
        supabaseConfig.save(trimmedUrl, trimmedKey);
      } catch (storageErr) {
        console.warn('Failed to save to localStorage:', storageErr);
      }
      
      onSuccess('接続設定をローカルに保持しました！');
    } catch (err: any) {
      onError(`接続設定エラー: ${err.message}`);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  return {
    supabase,
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
    saveSupabaseConfig
  };
}
