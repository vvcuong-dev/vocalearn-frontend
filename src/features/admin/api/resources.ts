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
  term?: string
  meaning?: string
  code?: string
  isSystem?: boolean
  isHiddenByAdmin?: boolean
  isPublic?: boolean
  creatorId?: number
  wordSetCount?: number
  creator?: { id: number; fullName: string }
  learningPath?: { id: number; name: string }
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
  | 'users'
  | 'categories'
  | 'learning-paths'
  | 'word-sets'
  | 'words'
  | 'folders'
  | 'roles'
interface ResourceConfig {
  title: string
  description: string
  icon: IconName
  color: string
  columns: { label: string; field: keyof ResourceItem }[]
}
export const resources: Record<ResourceKey, ResourceConfig> = {
  words: {
    title: 'Từ vựng',
    description: 'Quản lý các từ trong bộ từ đang chọn.',
    icon: 'book',
    color: 'bg-blue-50 text-blue-500',
    columns: [{ label: 'Nghĩa', field: 'meaning' }],
  },
  folders: {
    title: 'Thư mục',
    description: 'Xem và kiểm duyệt thư mục của người học.',
    icon: 'folder',
    color: 'bg-amber-50 text-amber-500',
    columns: [
      { label: 'Người tạo (ID)', field: 'creatorId' },
      { label: 'Số bộ từ', field: 'wordSetCount' },
      { label: 'Đang ẩn', field: 'isHiddenByAdmin' },
    ],
  },
  roles: {
    title: 'Vai trò',
    description: 'Quản lý vai trò và phân quyền truy cập.',
    icon: 'shield',
    color: 'bg-violet-50 text-violet-500',
    columns: [
      { label: 'Mã vai trò', field: 'code' },
      { label: 'Vai trò hệ thống', field: 'isSystem' },
    ],
  },
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
