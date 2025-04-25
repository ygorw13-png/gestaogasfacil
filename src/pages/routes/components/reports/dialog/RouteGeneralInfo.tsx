
import React from 'react';
import { RouteReport } from '../../../data/mockRouteReports';

interface RouteGeneralInfoProps {
  report: RouteReport;
}

export function RouteGeneralInfo({ report }: RouteGeneralInfoProps) {
  return (
    <div className="bg-secondary p-4 rounded-lg">
      <h4 className="font-medium mb-2">Informações Gerais</h4>
      <p><span className="font-semibold">Motorista:</span> {report.driver}</p>
      <p><span className="font-semibold">Destino:</span> {report.destination}</p>
      <p><span className="font-semibold">Total de vendas:</span> {report.salesCount}</p>
      <p><span className="font-semibold">Valor total:</span> R$ {report.totalAmount.toFixed(2)}</p>
    </div>
  );
}
