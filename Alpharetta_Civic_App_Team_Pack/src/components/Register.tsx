/** Column captions above a register list. Decorative: each row names its own fields for screen readers. */
export function RegisterHead({ columns, className = '' }: { columns: string[]; className?: string }) {
  return (
    <div className={`register-head ${className}`.trim()} aria-hidden="true">
      {columns.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}
