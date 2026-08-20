import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FileText, Download, Trash2, Plus } from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';

interface DocumentsTabProps {
  documents: any[];
  setDocUploadModalOpen: (val: boolean) => void;
  handleDownloadDocument: (doc: any) => void;
  handleDeleteDocument: (documentId: number) => void;
}

export default function DocumentsTab({
  documents,
  setDocUploadModalOpen,
  handleDownloadDocument,
  handleDeleteDocument,
}: DocumentsTabProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const borderCol = adminTheme.border;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  return (
    <View style={styles.documentsContainer}>
      {documents.length > 0 && (
        <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 4 }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
        </Text>
      )}

      {/* Documents Grid */}
      <View style={styles.docGrid}>
        {documents.map((doc) => (
          <View key={doc.documentId} style={[styles.docCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Top Visual Half (File Preview Area) */}
            <View style={[styles.docPreviewArea, { backgroundColor: inputBg }]}>
              <FileText size={32} color={brandCol} />
              <Text style={[styles.docTypeBadge, { color: textColor }]} numberOfLines={1}>
                {doc.documentType}
              </Text>
            </View>

            {/* Bottom Info Half */}
            <View style={styles.docInfo}>
              <Text style={[styles.docNameText, { color: textColor }]} numberOfLines={1}>
                {doc.fileName}
              </Text>
              <Text style={{ fontSize: 9, color: subTextColor }} numberOfLines={1}>
                by {doc.uploadedBy || 'admin'} • {doc.uploadedOn ? doc.uploadedOn.split('T')[0] : ''}
              </Text>
            </View>

            {/* Overlays / Action Buttons */}
            <View style={styles.actionsOverlay}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.shadowStyle, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                onPress={() => handleDownloadDocument(doc)}
              >
                <Download size={11} color={textColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.shadowStyle, { backgroundColor: 'rgba(239,68,68,0.95)' }]}
                onPress={() => handleDeleteDocument(doc.documentId)}
              >
                <Trash2 size={11} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* The Add Document Card inside the Grid (moves dynamically as documents are added) */}
        <TouchableOpacity
          style={[
            styles.docCard,
            styles.uploadCard,
            { backgroundColor: cardBg, borderColor: borderCol, borderStyle: 'dashed' },
          ]}
          onPress={() => setDocUploadModalOpen(true)}
        >
          <View style={styles.uploadCardContent}>
            <View style={[styles.plusIconWrap, { backgroundColor: brandCol }]}>
              <Plus size={18} color="#fff" />
            </View>
            <Text style={[styles.uploadCardText, { color: textColor }]}>Add Doc</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  documentsContainer: {
    gap: 16,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  docCard: {
    width: Platform.OS === 'web' ? '23%' : '47%',
    height: 155,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  docPreviewArea: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  docTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  docInfo: {
    padding: 8,
  },
  docNameText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowStyle: {
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  uploadCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  uploadCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  uploadCardText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
