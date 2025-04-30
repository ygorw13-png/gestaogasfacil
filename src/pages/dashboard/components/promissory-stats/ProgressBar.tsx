
interface ProgressBarProps {
  label: string;
  target: number;
  current: number;
}

export function ProgressBar({ label, target, current }: ProgressBarProps) {
  const percentage = Math.round((current / target) * 100);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{label} (R$ {target})</div>
        <div className="text-sm text-muted-foreground">
          {percentage}%
        </div>
      </div>
      <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
        <div 
          className="h-full bg-primary" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
