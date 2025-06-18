
// Function to check if a value is an Excel date serial number
export const isExcelDate = (value: any): boolean => {
  if (typeof value !== 'number') return false;
  // Excel date serial numbers are typically between 1 (1900-01-01) and 2958465 (9999-12-31)
  return value > 0 && value < 2958466 && value % 1 !== 0.999; // Exclude obvious non-dates
};

// Function to convert Excel date serial number to dd/mm/yyyy format
export const convertExcelDateToString = (serialNumber: number): string => {
  try {
    // Excel date base is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
    const baseDate = new Date(1900, 0, 1);
    const days = serialNumber - 1; // Subtract 1 because Excel starts from 1, not 0
    const resultDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    const day = resultDate.getDate().toString().padStart(2, '0');
    const month = (resultDate.getMonth() + 1).toString().padStart(2, '0');
    const year = resultDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.log('Error converting date:', error);
    return serialNumber.toString(); // Return original value if conversion fails
  }
};

// Function to detect and convert date columns
export const processDateColumns = (data: Record<string, any>[]): Record<string, any>[] => {
  if (data.length === 0) return data;

  // Detect potential date columns by checking if most values in a column are Excel date numbers
  const columns = Object.keys(data[0]);
  const dateColumns = new Set<string>();

  columns.forEach(column => {
    const columnName = column.toLowerCase();
    // Check if column name suggests it's a date field
    const isDateColumnName = columnName.includes('ngày') || 
                            columnName.includes('date') || 
                            columnName.includes('birth') || 
                            columnName.includes('sinh');

    if (isDateColumnName) {
      // Sample first few rows to see if they contain Excel date numbers
      const sampleSize = Math.min(5, data.length);
      let dateCount = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        if (isExcelDate(data[i][column])) {
          dateCount++;
        }
      }
      
      // If more than half of sampled values are Excel dates, treat as date column
      if (dateCount > sampleSize / 2) {
        dateColumns.add(column);
        console.log(`Detected date column: ${column}`);
      }
    }
  });

  // Convert date columns
  return data.map(row => {
    const newRow = { ...row };
    dateColumns.forEach(column => {
      if (isExcelDate(row[column])) {
        const convertedDate = convertExcelDateToString(row[column] as number);
        newRow[column] = convertedDate;
        console.log(`Converted date in ${column}: ${row[column]} -> ${convertedDate}`);
      }
    });
    return newRow;
  });
};
