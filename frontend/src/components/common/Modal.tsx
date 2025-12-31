import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full mx-4 glass-card p-6 fade-in max-h-[85vh] max-w-[95vw] overflow-hidden flex flex-col",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
