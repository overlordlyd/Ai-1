export enum AppMode {
  ImageToImage = 'ImageToImage',
  ImageToVideo = 'ImageToVideo',
}

export interface UploadedFile {
  file: File;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  id: number;
  type: 'image' | 'video';
  status: 'success' | 'censored';
  url: string | null;
  text: string | null;
}