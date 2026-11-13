import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
  Vibration,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
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

  const [actionDoc, setActionDoc] = useState<any | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const handleLongPress = (doc: any, event?: GestureResponderEvent) => {
    try {
      Vibration.vibrate(50);
    } catch {}

    if (event?.nativeEvent) {
      const { pageY, pageX } = event.nativeEvent;
      const screenHeight = Dimensions.get('window').height;
      const screenWidth = Dimensions.get('window').width;
      const menuHeight = 150;
      const menuWidth = 220;

      let top = pageY - 10;
      if (top + menuHeight > screenHeight - 50) {
        top = Math.max(50, pageY - menuHeight - 10);
      } else {
        top = Math.max(50, top);
      }

      let left = pageX ? pageX - 60 : (screenWidth - menuWidth) / 2;
      if (left + menuWidth > screenWidth - 16) {
        left = screenWidth - menuWidth - 16;
      }
      left = Math.max(16, left);

      setMenuPosition({ top, left });
    } else {
      setMenuPosition(null);
    }

    setActionDoc(doc);
  };

  const confirmDeleteDocument = (doc: any) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.fileName || doc.documentType}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteDocument(doc.documentId),
        },
      ]
    );
  };

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
          <TouchableOpacity
            key={doc.documentId}
            activeOpacity={0.88}
            onPress={() => handleDownloadDocument(doc)}
            onLongPress={(e) => handleLongPress(doc, e)}
            delayLongPress={350}
            style={[styles.docCard, { backgroundColor: cardBg, borderColor: borderCol }]}
          >
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
          </TouchableOpacity>
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

      {/* Action Dropdown Modal on Long Press */}
      <Modal
        visible={actionDoc !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActionDoc(null);
          setMenuPosition(null);
        }}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setActionDoc(null);
            setMenuPosition(null);
          }}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: cardBg,
                borderColor: borderCol,
              },
              menuPosition
                ? {
                    position: 'absolute',
                    top: menuPosition.top,
                    left: menuPosition.left,
                  }
                : {
                    position: 'absolute',
                    top: 180,
                    alignSelf: 'center',
                  },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownTitle, { color: textColor }]} numberOfLines={1}>
                Document Options
              </Text>
              <Text style={[styles.dropdownSubtitle, { color: subTextColor }]} numberOfLines={1}>
                {actionDoc?.fileName || actionDoc?.documentType}
              </Text>
            </View>

            <View style={[styles.dropdownDivider, { backgroundColor: borderCol }]} />

            {/* Download Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionDoc) return;
                const doc = actionDoc;
                setActionDoc(null);
                setMenuPosition(null);
                handleDownloadDocument(doc);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: brandCol + '15' }]}>
                <Download size={16} color={brandCol} />
              </View>
              <Text style={[styles.dropdownItemText, { color: textColor }]}>Download Document</Text>
            </TouchableOpacity>

            {/* Delete Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionDoc) return;
                const doc = actionDoc;
                setActionDoc(null);
                setMenuPosition(null);
                confirmDeleteDocument(doc);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: '#ef444415' }]}>
                <Trash2 size={16} color="#ef4444" />
              </View>
              <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Delete Document</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    width: 230,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
