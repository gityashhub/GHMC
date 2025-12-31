import { cn } from "@/lib/utils";

type StatusType = "paid" | "pending" | "partial";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  paid: {
    label: "Paid",
    className: "status-paid",
  },
  pending: {
    label: "Pending",
    className: "status-pending",
  },
  partial: {
    label: "Partial",
    className: "status-partial",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.label}
    </span>
  );
}
