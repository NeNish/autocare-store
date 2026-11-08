import { STATUS_STYLES, STATUS_LABELS } from '@/lib/format';

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] ${STATUS_STYLES[status] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
