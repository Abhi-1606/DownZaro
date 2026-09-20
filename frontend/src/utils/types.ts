export type ThemeMode = 'light' | 'dark' | 'system';

export interface VideoFormat {
  format_id: string;
  resolution: string;
  height: number;
  width?: number;
  fps: number;
  ext: string;
  codec: string;
  hdr?: string | null;
  size_bytes: number;
  is_recommended: boolean;
  requires_merge: boolean;
}

export interface AudioFormat {
  audio_id: string;
  title: string;
  bitrate: string;
  ext: string;
  badge: string;
  is_recommended: boolean;
  size_bytes: number;
}

export interface ThumbnailFormat {
  thumb_id: string;
  resolution: string;
  width?: number;
  height?: number;
  url: string;
  ext: string;
  is_recommended: boolean;
}

export interface PreviewQuality {
  quality: string;
  height: number;
  stream_url: string;
  direct_url?: string;
  fps?: number;
  has_audio?: boolean;
}

export interface MediaDetails {
  video_id: string;
  extractor_key: string;
  title: string;
  uploader: string;
  uploader_url?: string;
  duration: number;
  duration_formatted: string;
  view_count?: number;
  like_count?: number;
  upload_date?: string;
  description: string;
  thumbnail?: string;
  preview_stream_url?: string;
  preview_streams?: PreviewQuality[];
  embed_url?: string;
  has_audio: boolean;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
  thumbnails: ThumbnailFormat[];
  webpage_url?: string;
}

export interface MediaInfoResponse {
  success: boolean;
  platform_id: string;
  platform_name: string;
  icon: string;
  canonical_url: string;
  start_seconds: number;
  stream_token?: string;
  preview_proxy_url?: string;
  preview_qualities?: PreviewQuality[];
  media: MediaDetails;
}

export type JobStatus =
  | 'queued'
  | 'preparing'
  | 'downloading_video'
  | 'downloading_audio'
  | 'merging'
  | 'converting'
  | 'ready'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'interrupted';

export interface DownloadJob {
  job_id: string;
  title: string;
  platform_id: string;
  url: string;
  format_type: 'video' | 'audio' | 'thumbnail' | 'all_in_one';
  format_label: string;
  status: JobStatus;
  stage_label: string;
  progress_percent: number;
  speed: string;
  eta: string;
  filename?: string;
  download_url?: string;
  error?: string;
  created_at: number;
  thumbnail_url?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  platform_id: string;
  platform_name: string;
  format_type: string;
  quality: string;
  size_bytes?: number;
  date: string;
  status: 'Completed' | 'Failed' | 'Cancelled' | 'Interrupted';
  thumbnail?: string;
  filename?: string;
  download_url?: string;
}

export interface HealthInfo {
  status: string;
  ytdlp_installed: boolean;
  ytdlp_version?: string;
  ffmpeg_installed: boolean;
  ffmpeg_version?: string;
}
