export interface RenderJob {
  id: string;
  brandId: string;
  composition: any;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface RenderResult {
  mediaId: string;
  url: string;
  duration: number;
  fps: number;
  codec: string;
  size: number;
}
