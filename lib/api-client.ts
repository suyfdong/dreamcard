/**
 * API Client for DreamCard frontend
 */

export interface GenerateRequest {
  inputText: string;
  style: 'memory' | 'surreal' | 'lucid' | 'fantasy';
  symbols?: string[];
  mood?: string;
  visibility?: 'private' | 'public';
}

export interface GenerateResponse {
  projectId: string;
  jobId: string;
}

export interface StatusResponse {
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number; // 0-1
  projectId: string;
  error: string | null;
}

export interface Panel {
  position: number;
  caption: string;
  imageUrl: string | null;
  sketchUrl: string | null;
}

export interface ProjectResponse {
  projectId: string;
  inputText: string;
  style: string;
  symbols: string[];
  mood?: string;
  panels: Panel[];
  collageUrl?: string | null;
  videoUrl?: string | null;
  shareSlug?: string | null;
  visibility: string;
  status: string;
  progress: number;
  errorMsg?: string | null;
  createdAt: string;
}

export class DreamCardAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a new dream card
   */
  async generate(data: GenerateRequest): Promise<GenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate dream card');
    }

    return response.json();
  }

  /**
   * Check generation status
   */
  async getStatus(jobId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/status?jobId=${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get status');
    }

    return response.json();
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<ProjectResponse> {
    const response = await fetch(`${this.baseUrl}/api/project?projectId=${projectId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get project');
    }

    return response.json();
  }

  /**
   * Poll status until completion or failure
   */
  async pollStatus(
    jobId: string,
    onProgress?: (status: StatusResponse) => void,
    interval: number = 2000
  ): Promise<StatusResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getStatus(jobId);

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'success' || status.status === 'failed') {
            resolve(status);
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Export singleton instance
export const apiClient = new DreamCardAPI();
