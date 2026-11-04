"use client";

import React, { useState } from 'react';

interface LicenseKeyItem {
  id: string;
  key: string;
  plan: string;
  deviceId: string | null;
}

interface LicenseListProps {
  licenseKeys: LicenseKeyItem[];
}

export default function LicenseList({ licenseKeys }: LicenseListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #0b63ff', borderRadius: '12px', padding: '20px', marginBottom: '24px', color: '#000' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0b63ff', margin: '0 0 10px 0', fontSize: '18px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Your Purchased License Keys
      </h3>
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>Use the license keys below to activate the Chrome Extension. Each key is locked to exactly one device.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {licenseKeys.map((lk) => (
          <div key={lk.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ebecedcc', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', color: '#0b63ff', letterSpacing: '0.5px' }}>{lk.key}</span>
                <span style={{ fontSize: '11px', background: lk.plan === 'lifetime' ? 'rgba(11, 99, 255, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: lk.plan === 'lifetime' ? '#0b63ff' : '#059669', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize', fontWeight: 'bold' }}>{lk.plan}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {lk.deviceId ? `Locked to Device: ${lk.deviceId.substring(0, 15)}...` : "Status: Ready for Activation (Not Locked Yet)"}
              </span>
            </div>
            <button
              onClick={() => handleCopy(lk.id, lk.key)}
              style={{ background: copiedId === lk.id ? '#10b981' : '#0b63ff', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
            >
              {copiedId === lk.id ? "Copied!" : "Copy Key"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
