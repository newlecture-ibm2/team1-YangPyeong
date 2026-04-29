import { useState, useEffect } from 'react';

export interface GovUser {
  id: number;
  name: string;
  role: string;
  region: string;
  regionCode: string;
  regionName: string;
}

export function useGovUser() {
  const [user, setUser] = useState<GovUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For testing: localStorage.getItem('X-USER-ID') || '9040';
    const testUserId = typeof window !== 'undefined' ? localStorage.getItem('X-USER-ID') || '9040' : '9040';
    fetch('/api/gov/me', {
      headers: { 'X-USER-ID': testUserId }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success === false) throw new Error(json.error?.message);
        setUser(json.data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return { user, loading };
}

export function getTestHeaders() {
  const testUserId = typeof window !== 'undefined' ? localStorage.getItem('X-USER-ID') || '9040' : '9040';
  return { 'X-USER-ID': testUserId };
}
