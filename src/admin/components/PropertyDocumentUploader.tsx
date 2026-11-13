import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { Upload, FileText, X, Check, FileUp } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { PropertyService } from '../services/PropertyService';
import FileUploadProgress from './FileUploadProgress';

interface PropertyDocumentUploaderProps {
  propertyId: number | string;
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const DOCUMENT_TYPES = [
  'General',
  'Floor Plan',
  'Title Deed',
  'RERA Approval',
  'Brochure',
  'Legal Agreement',
  'Encumbrance Certificate',
  'Tax Receipt',
];

export default function PropertyDocumentUploader({
  propertyId,
  visible,
  onClose,
  onUploadSuccess,
}: PropertyDocumentUploaderProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [selectedDocType, setSelectedDocType] = useState<string>('General');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const handlePickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile({
              name: file.name,
              size: file.size,
              mimeType: file.type,
              file: file,
            });
            setUploadStatus(null);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/*',
          ],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          setSelectedFile({
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            uri: file.uri,
          });
          setUploadStatus(null);
        }
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Selection Failed', text2: err.message });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Toast.show({ type: 'error', text1: 'Missing File', text2: 'Please select a document first' });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(25);

      const formData = new FormData();
      formData.append('propertyId', String(propertyId));
      formData.append('propertyIdForm', String(propertyId));
      formData.append('documentType', selectedDocType);

      if (Platform.OS === 'web' && selectedFile.file) {
        formData.append('file', selectedFile.file);
      } else {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name || 'document.pdf',
          type: selectedFile.mimeType || 'application/pdf',
        } as any);
      }

      setUploadProgress(65);
      const res = await PropertyService.uploadDocument(formData);
      setUploadProgress(100);

      if (res && res.success !== false) {
        setUploadStatus('success');
        Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Property document attached successfully' });
        setTimeout(() => {
          setSelectedFile(null);
          setUploadStatus(null);
          onUploadSuccess();
          onClose();
        }, 800);
      } else {
        setUploadStatus('error');
        setErrorMessage(res?.message || 'Upload failed');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err?.response?.data?.message || err?.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { backgroundColor: `${brandCol}15` }]}>
                <FileUp size={18} color={brandCol} />
              </View>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Upload Property Document</Text>
                <Text style={[styles.subtitle, { color: subTextColor }]}>Property #{propertyId}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={subTextColor} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={[styles.label, { color: subTextColor }]}>Document Category</Text>
            <View style={styles.typeWrap}>
              {DOCUMENT_TYPES.map((type) => {
                const isSelected = selectedDocType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedDocType(type)}
                    style={[
                      styles.typePill,
                      { backgroundColor: inputBg, borderColor: isSelected ? brandCol : borderCol },
                      isSelected && { backgroundColor: `${brandCol}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* File Pick Area */}
            <Text style={[styles.label, { color: subTextColor, marginTop: 14 }]}>File</Text>
            {selectedFile ? (
              <View style={[styles.selectedFileBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <FileText size={22} color={brandCol} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedFileName, { color: textColor }]} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  {selectedFile.size ? (
                    <Text style={{ fontSize: 11, color: subTextColor }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <X size={16} color={subTextColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickDocument}
                style={[styles.uploadBox, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Upload size={24} color={brandCol} />
                <Text style={[styles.uploadPrompt, { color: textColor }]}>
                  Select PDF, Doc or Image
                </Text>
                <Text style={{ fontSize: 10, color: subTextColor, marginTop: 2 }}>
                  Max size: 20 MB
                </Text>
              </TouchableOpacity>
            )}

            {/* Progress Bar */}
            {uploadStatus && selectedFile && (
              <FileUploadProgress
                fileName={selectedFile.name}
                progress={uploadProgress}
                status={uploadStatus}
                errorMessage={errorMessage}
                onRetry={handleUpload}
              />
            )}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: borderCol }]}>
            <TouchableOpacity onPress={onClose} disabled={uploading} style={[styles.cancelBtn, { borderColor: borderCol }]}>
              <Text style={[styles.cancelText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpload}
              disabled={uploading || !selectedFile}
              style={[
                styles.submitBtn,
                { backgroundColor: brandCol },
                (!selectedFile || uploading) && { opacity: 0.6 },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Upload Document</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPrompt: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

