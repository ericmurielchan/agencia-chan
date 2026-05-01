/**
 * Utilitário para exportação de dados financeiros para CSV
 */

export const downloadCSV = (data: any[], filename: string, headers: string[]) => {
  if (!data || !data.length) return;

  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header] ?? '';
        // Tratar vírgulas e aspas para CSV
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatCurrencyCSV = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
