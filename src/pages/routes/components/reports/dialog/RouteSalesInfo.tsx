
import React from 'react';
import { RouteReport } from '../../../data/mockRouteReports';

interface RouteSalesInfoProps {
  report: RouteReport;
}

export function RouteSalesInfo({ report }: RouteSalesInfoProps) {
  return (
    <div className="bg-secondary p-4 rounded-lg">
      <h4 className="font-medium mb-2">Produtos Vendidos</h4>
      <p><span className="font-semibold">Gás P13:</span> {report.details.gasP13Sold} unidades</p>
      <p><span className="font-semibold">Gás P20:</span> {report.details.gasP20Sold} unidades</p>
      <p><span className="font-semibold">Gás P45:</span> {report.details.gasP45Sold} unidades</p>
      <p><span className="font-semibold">Água:</span> {report.details.waterSold} unidades</p>
    </div>
  );
}
