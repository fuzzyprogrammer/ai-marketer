export interface PosterJob {
  id: string;
  brandId: string;
  postId: string;
  channels: string[];
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PostResult {
  channel: string;
  status: 'success' | 'failed';
  platformPostId?: string;
  postedAt?: string;
  error?: string;
}
