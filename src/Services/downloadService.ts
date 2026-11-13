import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { TokenStorage } from '../auth/storage/TokenStorage';
import { getApiUrl } from '../api/remoteConfig';

export interface FileDownloadOptions {
  url: string;
  fileName: string;
  mimeType?: string;
  dialogTitle?: string;
}

/**
 * Downloads a remote file (or document/image) and saves or triggers native share on mobile,
 * or triggers a browser download on web.
 */
export async function downloadAndShareFile({
  url,
  fileName,
  mimeType = 'application/octet-stream',
  dialogTitle = 'Download File',
}: FileDownloadOptions): Promise<boolean> {
  try {
    const fullUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${getApiUrl().replace(/\/$/, '')}/${url.replace(/^\//, '')}`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Toast.show({ type: 'success', text1: 'Download Started', text2: fileName });
        return true;
      }
      return false;
    }

    // Mobile (Android / iOS)
    Toast.show({ type: 'info', text1: 'Downloading', text2: `Fetching ${fileName}...` });

    // Clean up file name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const localUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${sanitizedFileName}`;

    // Get Auth token if available
    const token = await TokenStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const downloadResult = await FileSystem.downloadAsync(fullUrl, localUri, {
      headers,
    });

    if (downloadResult.status !== 200) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: `Server returned status ${downloadResult.status}`,
      });
      return false;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType,
        dialogTitle: dialogTitle || `Save ${sanitizedFileName}`,
      });
      Toast.show({ type: 'success', text1: 'Downloaded', text2: `${fileName} saved` });
    } else {
      Toast.show({ type: 'success', text1: 'Saved', text2: `Saved to ${sanitizedFileName}` });
    }

    return true;
  } catch (error: any) {
    console.error('[DownloadService] error:', error);
    Toast.show({
      type: 'error',
      text1: 'Download Error',
      text2: error?.message || 'Failed to download file',
    });
    return false;
  }
}

