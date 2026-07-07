'use client';

type StatusKey =
  | 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'SENT'
  | 'DELIVERED' | 'READ' | 'FAILED' | 'RETRYING' | 'CANCELLED'
  | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'DRAFT';

const statusConfig: Record<StatusKey, { label: string; className: string }> = {
  UPLOADED: { label: 'Uploaded', className: 'badge-gray' },
  QUEUED: { label: 'Queued', className: 'badge-warning' },
  PROCESSING: { label: 'Processing', className: 'badge-info' },
  SENT: { label: 'Sent', className: 'badge-info' },
  DELIVERED: { label: 'Delivered', className: 'badge-success' },
  READ: { label: 'Read', className: 'badge-success' },
  FAILED: { label: 'Failed', className: 'badge-danger' },
  RETRYING: { label: 'Retrying', className: 'badge-orange' },
  CANCELLED: { label: 'Cancelled', className: 'badge-gray' },
  ACTIVE: { label: 'Active', className: 'badge-success' },
  INACTIVE: { label: 'Inactive', className: 'badge-gray' },
  COMPLETED: { label: 'Completed', className: 'badge-success' },
  DRAFT: { label: 'Draft', className: 'badge-gray' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusKey] || { label: status, className: 'badge-gray' };
  return <span className={config.className}>{config.label}</span>;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive
    ? <span className="badge-success">Active</span>
    : <span className="badge-gray">Inactive</span>;
}
