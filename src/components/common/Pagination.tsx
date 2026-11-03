import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '48px 0' }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="pagination-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          color: page <= 1 ? 'var(--text-muted)' : '#fff',
          border: '1px solid var(--border)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>

      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Page <strong style={{ color: '#fff' }}>{page}</strong> of <strong style={{ color: '#fff' }}>{totalPages}</strong> ({total.toLocaleString()} channels)
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="pagination-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          color: page >= totalPages ? 'var(--text-muted)' : '#fff',
          border: '1px solid var(--border)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}

