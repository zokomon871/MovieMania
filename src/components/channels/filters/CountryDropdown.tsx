import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Search, Check } from 'lucide-react';
import { ICountry } from '@/lib/types';

interface CountryDropdownProps {
  countries: ICountry[];
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  totalChannels: number;
}

export function CountryDropdown({
  countries,
  selectedCountry,
  onSelectCountry,
  totalChannels,
}: CountryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fullList = [
    { code: 'ALL', name: 'All Countries (Global)', flag: '🌐', count: totalChannels },
    ...countries.map((c) => ({ code: c.code, name: c.name, flag: c.flag || '🏳️', count: c.count || 0 })),
  ];

  const filtered = fullList.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const active = fullList.find((c) => c.code === selectedCountry) || fullList[0];

  return (
    <div className="country-filter-dropdown" ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="country-dropdown-trigger"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
      >
        <Globe size={16} color="var(--accent)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{active.flag} {active.name}</span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div className="country-dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '280px', maxHeight: '320px', overflowY: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', borderRadius: '12px', padding: '8px', zIndex: 100, boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              style={{ width: '100%', padding: '6px 10px 6px 30px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filtered.map((c) => {
              const isSelected = c.code === selectedCountry;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelectCountry(c.code);
                    setIsOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: isSelected ? 'var(--accent-muted)' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span>{c.flag} {c.name}</span>
                  {isSelected && <Check size={14} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

