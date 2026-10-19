import { useEffect, useRef, useState } from 'react';

// Searchable dropdown: type to filter, click to pick.
export default function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) =>
    (o.name + ' ' + (o.country || '')).toLowerCase().includes(q)
  );

  return (
    <div className="sselect" ref={wrapRef}>
      <input
        value={open ? query : selected ? selected.name : ''}
        placeholder={placeholder || 'Search…'}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        autoComplete="off"
      />
      {open && (
        <ul className="sselect-list">
          {filtered.length === 0 && <li className="sselect-empty">No matches</li>}
          {filtered.map((o) => (
            <li
              key={o.id}
              className={o.id === value ? 'sel' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o.id);
                setOpen(false);
              }}
            >
              {o.name}
              {o.country ? `, ${o.country}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
