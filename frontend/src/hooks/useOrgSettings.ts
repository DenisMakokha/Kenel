import { useState, useEffect } from 'react';
import { COMPANY_CONFIG } from '../config/company';

interface OrgSettings {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
}

const DEFAULT_ORG: OrgSettings = {
  companyName: COMPANY_CONFIG.fullName,
  contactEmail: COMPANY_CONFIG.email,
  contactPhone: COMPANY_CONFIG.phone,
  address: COMPANY_CONFIG.location.address,
  website: COMPANY_CONFIG.website,
};

let cachedSettings: OrgSettings | null = null;
let fetchPromise: Promise<OrgSettings> | null = null;

async function fetchOrgSettings(): Promise<OrgSettings> {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${baseUrl}/settings/org`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return {
      companyName: data.companyName || DEFAULT_ORG.companyName,
      contactEmail: data.contactEmail || DEFAULT_ORG.contactEmail,
      contactPhone: data.contactPhone || DEFAULT_ORG.contactPhone,
      address: data.address || DEFAULT_ORG.address,
      website: data.website || DEFAULT_ORG.website,
    };
  } catch {
    return DEFAULT_ORG;
  }
}

export function useOrgSettings(): OrgSettings {
  const [settings, setSettings] = useState<OrgSettings>(cachedSettings || DEFAULT_ORG);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetchOrgSettings();
    }
    fetchPromise.then((s) => {
      cachedSettings = s;
      setSettings(s);
    });
  }, []);

  return settings;
}

export { DEFAULT_ORG };
export type { OrgSettings };
