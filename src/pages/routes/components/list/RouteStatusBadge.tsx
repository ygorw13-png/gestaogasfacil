
import React from 'react';
import { RouteStatusProps } from '../../types/routeListTypes';
import { getStatusColor, getStatusText } from '../../utils/routeStatusUtils';

export function RouteStatusBadge({ status }: RouteStatusProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}
