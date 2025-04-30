
import { ProgressBar } from "./ProgressBar";
import { ProjectionCard } from "./ProjectionCard";

interface ProjectionData {
  daily: { recommended: number; current: number };
  weekly: { recommended: number; current: number };
  monthly: { recommended: number; current: number };
  total: { receivable: number; overdue: number };
}

interface ProjectionContentProps {
  data: ProjectionData;
}

export function ProjectionContent({ data }: ProjectionContentProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ProjectionCard
          title="Total a Receber"
          value={data.total.receivable}
          subtitle={`Incluindo ${data.total.overdue.toLocaleString('pt-BR')} em atraso`}
        />
        
        <ProjectionCard title="Meta Recomendada" value="">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Dia</div>
              <div className="font-medium">R$ {data.daily.recommended}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Semana</div>
              <div className="font-medium">R$ {data.weekly.recommended}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Mês</div>
              <div className="font-medium">R$ {data.monthly.recommended}</div>
            </div>
          </div>
        </ProjectionCard>
      </div>
      
      <div className="space-y-4">
        <ProgressBar 
          label="Meta Diária" 
          target={data.daily.recommended} 
          current={data.daily.current} 
        />
        
        <ProgressBar 
          label="Meta Semanal" 
          target={data.weekly.recommended} 
          current={data.weekly.current} 
        />
        
        <ProgressBar 
          label="Meta Mensal" 
          target={data.monthly.recommended} 
          current={data.monthly.current} 
        />
      </div>
    </>
  );
}
