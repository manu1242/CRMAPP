import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import Toast from 'react-native-toast-message';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface ExportColumn<T = any> {
  header: string;
  key: keyof T | string;
  formatter?: (value: any, item: T) => string | number | boolean | null | undefined;
}

export interface ExportOptions<T = any> {
  /** Array of data items/objects or 2D array of rows */
  data: T[] | any[][];
  /** Base filename without extension (e.g., 'Agents_Report') */
  fileName?: string;
  /** Sheet name for Excel workbook (default: 'Sheet1') */
  sheetName?: string;
  /** Optional custom columns configuration for formatting and header mapping */
  columns?: ExportColumn<T>[];
  /** Custom header row if passing 2D array or overriding default keys */
  headers?: string[];
}

/**
 * Transforms input data into a 2D array format ready for XLSX/CSV export
 */
function prepareSheetData<T>(
  data: T[] | any[][],
  columns?: ExportColumn<T>[],
  headers?: string[]
): any[][] {
  if (!data || data.length === 0) {
    return [];
  }

  // Case 1: Data is already a 2D array
  if (Array.isArray(data[0])) {
    const raw2D = data as any[][];
    if (headers && headers.length > 0) {
      return [headers, ...raw2D];
    }
    return raw2D;
  }

  // Case 2: Custom columns provided for object array
  const objectData = data as T[];
  if (columns && columns.length > 0) {
    const headerRow = columns.map((col) => col.header);
    const rows = objectData.map((item) =>
      columns.map((col) => {
        const rawValue = (item as any)[col.key];
        if (col.formatter) {
          return col.formatter(rawValue, item);
        }
        if (rawValue === null || rawValue === undefined) return '';
        if (typeof rawValue === 'object') return JSON.stringify(rawValue);
        return rawValue;
      })
    );
    return [headerRow, ...rows];
  }

  // Case 3: Object array without column specs (auto-extract keys)
  const firstItem = objectData[0] as Record<string, any>;
  const keys = headers || Object.keys(firstItem);
  const rows = objectData.map((item: any) =>
    keys.map((key) => {
      const val = item[key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    })
  );

  return [keys, ...rows];
}

/**
 * Triggers file download or sharing across Web and Mobile (React Native)
 */
async function saveOrShareFile(
  base64OrBinary: string,
  fileName: string,
  mimeType: string,
  isBase64: boolean = false
): Promise<void> {
  const fullFileName = fileName;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = isBase64
        ? base64ToBlob(base64OrBinary, mimeType)
        : new Blob([base64OrBinary], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fullFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Toast.show({
        type: 'success',
        text1: 'Export Successful',
        text2: `Downloaded ${fullFileName}`,
      });
    }
    return;
  }

  // Mobile platforms (iOS & Android) using modern expo-file-system & expo-sharing
  try {
    const file = new File(Paths.cache, fullFileName);
    file.create({ overwrite: true });

    if (isBase64) {
      const bytes = base64ToUint8Array(base64OrBinary);
      file.write(bytes);
    } else {
      file.write(base64OrBinary);
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: `Export ${fullFileName}`,
        UTI: fullFileName.endsWith('.xlsx')
          ? 'org.openxmlformats.spreadsheetml.sheet'
          : 'public.comma-separated-values-text',
      });
      Toast.show({
        type: 'success',
        text1: 'Export Ready',
        text2: 'File shared successfully',
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'File Saved',
        text2: `Saved to ${file.uri}`,
      });
    }
  } catch (error: any) {
    console.warn('Mobile file sharing error:', error);
    Toast.show({
      type: 'error',
      text1: 'Export Error',
      text2: error?.message || 'Failed to export file on device.',
    });
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = base64.replace(/=+$/, '');
  const output = new Uint8Array((str.length * 3) / 4 || 0);
  let l = 0;
  for (let i = 0; i < str.length; i += 4) {
    const b0 = chars.indexOf(str.charAt(i));
    const b1 = chars.indexOf(str.charAt(i + 1));
    const b2 = chars.indexOf(str.charAt(i + 2));
    const b3 = chars.indexOf(str.charAt(i + 3));

    output[l++] = (b0 << 2) | (b1 >> 4);
    if (b2 !== -1) output[l++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (b3 !== -1) output[l++] = ((b2 & 3) << 6) | b3;
  }
  return output.subarray(0, l);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays as any[], { type: mimeType });
}

/**
 * Export data to Excel (.xlsx) file
 * 
 * @example
 * ```ts
 * await exportToExcel({
 *   data: agentsList,
 *   fileName: 'Agents_List',
 *   sheetName: 'Agents',
 *   columns: [
 *     { header: 'ID', key: 'agentId' },
 *     { header: 'Name', key: 'fullName' },
 *     { header: 'Phone', key: 'phone' },
 *     { header: 'Status', key: 'status' },
 *   ]
 * });
 * ```
 */
export async function exportToExcel<T = any>({
  data,
  fileName = `Export_${new Date().toISOString().split('T')[0]}`,
  sheetName = 'Sheet1',
  columns,
  headers,
}: ExportOptions<T>): Promise<void> {
  if (!data || data.length === 0) {
    Toast.show({ type: 'error', text1: 'Export Failed', text2: 'No data available to export.' });
    return;
  }

  const sheetData = prepareSheetData(data, columns, headers);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-fit column widths
  const colWidths = sheetData[0]?.map((_, colIndex) => {
    let maxLen = 10;
    sheetData.forEach((row) => {
      const cellVal = row[colIndex] ? String(row[colIndex]) : '';
      if (cellVal.length > maxLen) {
        maxLen = Math.min(cellVal.length + 3, 50);
      }
    });
    return { wch: maxLen };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  const resolvedFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, resolvedFileName);
    Toast.show({ type: 'success', text1: 'Export Success', text2: `Downloaded ${resolvedFileName}` });
  } else {
    // Generate base64 string for mobile file writing
    const wboutBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    await saveOrShareFile(
      wboutBase64,
      resolvedFileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      true
    );
  }
}

/**
 * Export data to CSV (.csv) file
 * 
 * @example
 * ```ts
 * await exportToCSV({
 *   data: usersList,
 *   fileName: 'Users_Export',
 *   columns: [
 *     { header: 'User ID', key: 'id' },
 *     { header: 'Email Address', key: 'email' },
 *   ]
 * });
 * ```
 */
export async function exportToCSV<T = any>({
  data,
  fileName = `Export_${new Date().toISOString().split('T')[0]}`,
  columns,
  headers,
}: Omit<ExportOptions<T>, 'sheetName'>): Promise<void> {
  if (!data || data.length === 0) {
    Toast.show({ type: 'error', text1: 'Export Failed', text2: 'No data available to export.' });
    return;
  }

  const sheetData = prepareSheetData(data, columns, headers);
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const csvContent = XLSX.utils.sheet_to_csv(ws);

  const resolvedFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;

  await saveOrShareFile(
    csvContent,
    resolvedFileName,
    'text/csv;charset=utf-8;',
    false
  );
}
