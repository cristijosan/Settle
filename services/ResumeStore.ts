import { CvFile } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentPickerAsset } from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

const KEY = 'resume';

export const MAX_RESUME_BYTES = 24 * 1024 * 1024;

export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface StoredResume extends CvFile {
  size: number;
  addedAt: string;
}

const resumeDir = () => new Directory(Paths.document, 'resume');

export const ResumeStore = {
  async get(): Promise<StoredResume | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * The picker hands back a file in the cache, which the OS may clear,
   * so it is copied into the documents directory before being remembered.
   */
  async save(asset: DocumentPickerAsset): Promise<StoredResume> {
    const dir = resumeDir();
    if (dir.exists) dir.delete();
    dir.create();

    const source = new File(asset.uri);
    const destination = new File(dir, asset.name);
    source.copy(destination);

    const resume: StoredResume = {
      uri: destination.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? RESUME_MIME_TYPES[0],
      size: asset.size ?? destination.size ?? 0,
      addedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(resume));
    return resume;
  },

  async remove() {
    const dir = resumeDir();
    if (dir.exists) dir.delete();
    await AsyncStorage.removeItem(KEY);
  },
};
