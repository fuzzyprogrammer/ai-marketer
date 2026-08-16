import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = {
  // Brands
  brands: {
    list: () => axios.get(`${API_BASE}/api/brands`),
    get: (id: string) => axios.get(`${API_BASE}/api/brands/${id}`),
    create: (data: any) => axios.post(`${API_BASE}/api/brands`, data),
    update: (id: string, data: any) => axios.put(`${API_BASE}/api/brands/${id}`, data),
    delete: (id: string) => axios.delete(`${API_BASE}/api/brands/${id}`),
    import: (data: { sourceUrl?: string; files?: any[]; manualData?: any }) =>
      axios.post(`${API_BASE}/api/brands/import`, data),
  },

  // Jobs
  jobs: {
    list: (params?: any) => axios.get(`${API_BASE}/api/jobs`, { params }),
    get: (id: string) => axios.get(`${API_BASE}/api/jobs/${id}`),
    cancel: (id: string) => axios.post(`${API_BASE}/api/jobs/${id}/cancel`),
  },

  // Content
  content: {
    list: (brandId?: string) => axios.get(`${API_BASE}/api/content`, { params: { brandId } }),
    get: (id: string) => axios.get(`${API_BASE}/api/content/${id}`),
    create: (data: any) => axios.post(`${API_BASE}/api/content`, data),
    update: (id: string, data: any) => axios.put(`${API_BASE}/api/content/${id}`, data),
    approve: (id: string) => axios.post(`${API_BASE}/api/content/${id}/approve`),
    reject: (id: string) => axios.post(`${API_BASE}/api/content/${id}/reject`),
  },

  // Broker
  broker: {
    generate: (data: any) => axios.post(`${API_BASE}/api/broker/generate`, data),
    usage: (params?: any) => axios.get(`${API_BASE}/api/broker/usage`, { params }),
  },

  // Admin
  admin: {
    stats: () => axios.get(`${API_BASE}/api/admin/stats`),
    queue: () => axios.get(`${API_BASE}/api/admin/queue`),
  },
}
