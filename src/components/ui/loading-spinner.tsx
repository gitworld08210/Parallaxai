export const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center py-4 ${className}`}>
    <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);
