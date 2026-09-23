import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../../lib/api'
import { useApiQuery } from '../../../hooks/useApiQuery'
import { PageHeading } from '../../../components/ui/PageHeading'
import { QueryState } from '../../../components/ui/QueryState'
import { resources, type ResourceKey } from '../api/resources'
import { editorFields, resourcePayload } from '../api/editor'
import { RelationSelect } from '../components/RelationSelect'
export function AdminEditorPage({ resource }: { resource: ResourceKey }) {
  const { id } = useParams()
  const [params] = useSearchParams()
  const editing = !!id
  const query = useApiQuery<Record<string, unknown>>(
    id ? `/admin/${resource}/${id}` : null,
  )
  const wordSetId =
    Number(query.data?.wordSetId) ||
    Number(params.get('wordSetId')) ||
    undefined
  const parent = useApiQuery<Record<string, unknown>>(
    resource === 'words' && wordSetId ? `/admin/word-sets/${wordSetId}` : null,
  )
  if (resource === 'words' && (parent.loading || parent.error))
    return <QueryState {...parent} />
  if (resource === 'words' && !wordSetId && !editing)
    return (
      <Link className="text-link" to="/admin/word-sets">
        Chọn bộ từ trước khi thêm từ vựng
      </Link>
    )
  if (editing && (query.loading || query.error))
    return <QueryState {...query} />
  return (
    <Editor
      key={`${resource}:${id || 'new'}`}
      resource={resource}
      id={id}
      initial={query.data || {}}
      wordSetId={wordSetId}
      readOnly={resource === 'words' && !!parent.data?.creator}
    />
  )
}
function Editor({
  resource,
  id,
  initial,
  wordSetId,
  readOnly,
}: {
  resource: ResourceKey
  id?: string
  initial: Record<string, unknown>
  wordSetId?: number
  readOnly?: boolean
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const editing = !!id
  const back = `/admin/${resource}${resource === 'words' && wordSetId ? `?wordSetId=${wordSetId}` : ''}`
  const locked =
    readOnly ||
    (resource === 'roles' && initial.isSystem === true) ||
    (resource === 'word-sets' && !!initial.creator)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const payload = resourcePayload(
        resource,
        editing,
        new FormData(event.currentTarget),
        wordSetId,
      )
      await api(
        `/admin/${resource}${id ? `/${id}` : ''}`,
        editing ? 'PATCH' : 'POST',
        payload,
        true,
      )
      navigate(back, {
        state: { notice: editing ? 'Đã lưu thay đổi.' : 'Đã tạo thành công.' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu dữ liệu.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading
        title={`${editing ? 'Chi tiết / chỉnh sửa' : 'Thêm mới'} · ${resources[resource].title}`}
        description={
          editing
            ? `Bản ghi #${id}`
            : 'Điền thông tin bên dưới để tạo dữ liệu mới.'
        }
        action={
          <Link to={back} className="secondary">
            Về danh sách
          </Link>
        }
      />
      <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {locked && (
          <p className="mb-5 text-sm text-amber-700">
            Bản ghi này chỉ được xem, không được chỉnh sửa qua chức năng hiện
            tại.
          </p>
        )}
        {error && (
          <div className="mb-5">
            <QueryState error={error} />
          </div>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={busy || locked} className="space-y-5">
            {editorFields(resource, editing).map((field) => {
              const value = initial[field.name] ?? field.defaultValue
              if (field.relation)
                return (
                  <RelationSelect
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    resource={field.relation}
                    initial={typeof value === 'number' ? value : undefined}
                  />
                )
              if (field.type === 'checkbox')
                return (
                  <label
                    key={field.name}
                    className="flex items-center gap-3 text-sm font-semibold"
                  >
                    <input
                      name={field.name}
                      type="checkbox"
                      defaultChecked={Boolean(value)}
                      className="h-4 w-4 accent-brand"
                    />
                    {field.label}
                  </label>
                )
              const common = {
                id: field.name,
                name: field.name,
                required: field.required,
                defaultValue:
                  typeof value === 'string' || typeof value === 'number'
                    ? value
                    : '',
                className: 'field',
              }
              return (
                <div key={field.name} className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-semibold"
                  >
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      {...common}
                      rows={4}
                      maxLength={field.maxLength}
                    />
                  ) : field.type === 'select' ? (
                    <select {...common}>
                      <option value="">Chọn giá trị</option>
                      {field.options?.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={field.type || 'text'}
                      min={field.min}
                      max={field.max}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                      step={field.type === 'number' ? 1 : undefined}
                      autoComplete={
                        field.type === 'password' ? 'new-password' : undefined
                      }
                    />
                  )}
                </div>
              )
            })}
            {!locked && (
              <button className="primary" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu thông tin'}
              </button>
            )}
          </fieldset>
        </form>
      </section>
    </>
  )
}
