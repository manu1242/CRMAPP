import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react-native';
import { exportToExcel, exportToCSV, ExportColumn } from '../Services/exportService';

export interface ExportButtonProps<T = any> {
  /** The data to export */
  data: T[] | any[][];
  /** Base filename without extension */
  fileName?: string;
  /** Sheet name for Excel workbook */
  sheetName?: string;
  /** Custom columns for formatting and key mapping */
  columns?: ExportColumn<T>[];
  /** Custom header strings if providing 2D array */
  headers?: string[];
  /** Button title when in standard mode */
  title?: string;
  /** Visual variant: 'modal' (dropdown popup), 'split' (two inline buttons), or 'icon' (compact) */
  variant?: 'modal' | 'split' | 'icon';
  /** Custom container style */
  style?: ViewStyle;
  /** Custom button background color */
  buttonBg?: string;
  /** Custom text/icon color */
  textColor?: string;
}

export function ExportButton<T = any>({
  data,
  fileName = 'Export',
  sheetName = 'Data',
  columns,
  headers,
  title = 'Export',
  variant = 'modal',
  style,
  buttonBg = '#f3f4f6',
  textColor = '#374151',
}: ExportButtonProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'csv' | null>(null);

  const handleExport = async (type: 'excel' | 'csv') => {
    setIsExporting(true);
    setExportType(type);
    try {
      if (type === 'excel') {
        await exportToExcel({
          data,
          fileName,
          sheetName,
          columns,
          headers,
        });
      } else {
        await exportToCSV({
          data,
          fileName,
          columns,
          headers,
        });
      }
    } finally {
      setIsExporting(false);
      setExportType(null);
      setModalVisible(false);
    }
  };

  // Split variant: Renders two side-by-side buttons for Excel and CSV
  if (variant === 'split') {
    return (
      <View style={[styles.splitWrapper, style]}>
        <TouchableOpacity
          style={[styles.splitBtn, { backgroundColor: buttonBg }]}
          onPress={() => handleExport('excel')}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          {isExporting && exportType === 'excel' ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <FileSpreadsheet size={16} color="#16a34a" />
          )}
          <Text style={[styles.btnText, { color: textColor }]}>Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.splitBtn, { backgroundColor: buttonBg }]}
          onPress={() => handleExport('csv')}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          {isExporting && exportType === 'csv' ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <FileText size={16} color="#2563eb" />
          )}
          <Text style={[styles.btnText, { color: textColor }]}>CSV</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Icon / Modal variant
  return (
    <View style={style}>
      <TouchableOpacity
        style={[
          styles.mainBtn,
          variant === 'icon' && styles.iconOnlyBtn,
          { backgroundColor: buttonBg },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Download size={16} color={textColor} />
        {variant !== 'icon' && (
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        )}
      </TouchableOpacity>

      {/* Export Options Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !isExporting && setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Export Format</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isExporting}
                style={styles.closeBtn}
              >
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {/* Excel Option */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleExport('excel')}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#dcfce7' }]}>
                  {isExporting && exportType === 'excel' ? (
                    <ActivityIndicator size="small" color="#16a34a" />
                  ) : (
                    <FileSpreadsheet size={22} color="#16a34a" />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>Microsoft Excel (.xlsx)</Text>
                  <Text style={styles.optionDesc}>Formatted spreadsheet with columns</Text>
                </View>
              </TouchableOpacity>

              {/* CSV Option */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleExport('csv')}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#dbeafe' }]}>
                  {isExporting && exportType === 'csv' ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <FileText size={22} color="#2563eb" />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>CSV Document (.csv)</Text>
                  <Text style={styles.optionDesc}>Plain comma-separated values</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iconOnlyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  splitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
