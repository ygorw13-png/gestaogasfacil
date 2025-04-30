
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectionCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  children?: React.ReactNode;
}

export function ProjectionCard({ title, value, subtitle, children }: ProjectionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR')}` : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
