import { useState, useEffect } from 'react';

export interface GovUser {
  id: number;
  email: string;
  name: string;
  role: string;
  regionCode: string;
  regionName: string;
}

export function useGovUser() {
  const [user, setUser] = useState<GovUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gov/me')
      .then(res => res.json())
      .then(json => {
        if (json.success === false || !json.data) {
          setLoading(false);
          return;
        }
        setUser(json.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading };
}

export function getTestHeaders() {
  return {};
}
