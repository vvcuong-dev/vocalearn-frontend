import type { IconName } from '../../../components/ui/Icon'
export interface Page<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    totalRecord: number
    totalPage: number
  }
}
// List columns only use the common and optional fields exposed by these four APIs.
export interface ResourceItem {
  id: number
  name: string
  description?: string | null
  email?: string
  status?: string
  wordCount?: number
  isPro?: boolean
  isActive?: boolean
  difficulty?: number
  order?: number
}
export type ResourceKey =
  'users' | 'categories' | 'learning-paths' | 'word-sets'
interface ResourceConfig {
  title: string
  description: string
  icon: IconName
  color: string
  columns: { label: string; field: keyof ResourceItem }[]
}
export const resources: Record<ResourceKey, ResourceConfig> = {
  users: {
    title: 'Người dùng',
    description: 'Theo dõi các tài khoản học viên trên VocaLearn.',
    icon: 'users',
    color: 'bg-violet-50 text-violet-500',
    columns: [
      { label: 'Email', field: 'email' },
      { label: 'Trạng thái', field: 'status' },
    ],
  },
  categories: {
    title: 'Danh mục',
    description: 'Các nhóm nội dung học tập trong hệ thống.',
    icon: 'folder',
    color: 'bg-amber-50 text-amber-500',
    columns: [
      { label: 'Mô tả', field: 'description' },
      { label: 'Thứ tự', field: 'order' },
    ],
  },
  'learning-paths': {
    title: 'Lộ trình học',
    description: 'Theo dõi lộ trình và trạng thái xuất bản.',
    icon: 'route',
    color: 'bg-emerald-50 text-emerald-500',
    columns: [
      { label: 'Độ khó', field: 'difficulty' },
      { label: 'Trạng thái', field: 'isActive' },
    ],
  },
  'word-sets': {
    title: 'Bộ từ vựng',
    description: 'Khám phá và theo dõi kho bộ từ vựng hiện có.',
    icon: 'book',
    color: 'bg-blue-50 text-blue-500',
    columns: [
      { label: 'Số từ', field: 'wordCount' },
      { label: 'Loại bộ từ', field: 'isPro' },
    ],
  },
}
export const resourceKeys = Object.keys(resources) as ResourceKey[]
