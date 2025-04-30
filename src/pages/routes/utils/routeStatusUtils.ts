
/**
 * Returns the appropriate CSS classes for a route status.
 */
export const getStatusColor = (status: string) => {
  switch(status) {
    case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'completed': return 'bg-green-100 text-green-800 border-green-300';
    case 'verified': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Converts route status code to display text.
 */
export const getStatusText = (status: string) => {
  switch(status) {
    case 'preparing': return 'Em Preparação';
    case 'in-progress': return 'Em Progresso';
    case 'completed': return 'Concluída';
    case 'verified': return 'Verificada';
    default: return status;
  }
};
