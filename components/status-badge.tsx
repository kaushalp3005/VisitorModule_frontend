interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'WAITING' | 'APPROVED' | 'REJECTED';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Normalize status to lowercase for lookup
  const normalizedStatus = status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'waiting';

  const statusConfig = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending Approval',
    },
    waiting: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending Approval',
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Rejected',
    },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}
