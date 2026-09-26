import type { ReactNode } from "react";
import { CategoryName } from "./CategoryName";
import {
  resources,
  type ResourceItem,
  type ResourceKey,
} from "../api/resources";
function cell(item: ResourceItem, field: keyof ResourceItem) {
  if (field === "categoryId") return <CategoryName id={item.categoryId} />;
  const value = item[field];
  if (["isHiddenByAdmin", "isSystem", "isPublic"].includes(field))
    return value ? "Có" : "Không";
  if (field === "isPro")
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-600"}`}
      >
        {value ? "Pro" : "Miễn phí"}
      </span>
    );
  if (field === "isActive" || field === "status") {
    const active = value === true || value === "ACTIVE";
    const label =
      field === "isActive"
        ? active
          ? "Đang hiển thị"
          : "Đã ẩn"
        : {
            ACTIVE: "Hoạt động",
            INACTIVE: "Chưa kích hoạt",
            BANNED: "Đã khóa",
          }[String(value)] || String(value ?? "—");
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="line-clamp-2 max-w-md">
      {value === null || value === undefined || value === ""
        ? "—"
        : String(value)}
    </span>
  );
}
export function ResourceTable({
  resource,
  items,
  renderActions,
}: {
  resource: ResourceKey;
  items: ResourceItem[];
  renderActions?: (item: ResourceItem) => ReactNode;
}) {
  const config = resources[resource];
  if (!items.length)
    return (
      <div className="p-12 text-center">
        <p className="font-semibold text-slate-600">Chưa có dữ liệu phù hợp</p>
        <p className="mt-2 text-sm text-slate-400">
          Thử thay đổi từ khóa hoặc quay lại sau.
        </p>
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-145 text-left text-sm">
        <caption className="sr-only">
          Danh sách {config.title.toLowerCase()}
        </caption>
        <thead className="border-y border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <tr>
            <th className="px-6 py-4 font-medium">ID</th>
            <th className="px-6 py-4 font-medium">
              Tên {resource === "users" ? "người dùng" : ""}
            </th>
            {config.columns.map((column) => (
              <th key={column.field} className="px-6 py-4 font-medium">
                {column.label}
              </th>
            ))}
            {renderActions && (
              <th className="px-6 py-4 font-medium">Thao tác</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70">
              <td className="px-6 py-5 text-slate-400">#{item.id}</td>
              <td className="max-w-xs wrap-break-word px-6 py-5 font-semibold text-slate-700">
                {item.name || item.term}
              </td>
              {config.columns.map((column) => (
                <td key={column.field} className="px-6 py-5 text-slate-500">
                  {cell(item, column.field)}
                </td>
              ))}
              {renderActions && (
                <td className="px-6 py-5">{renderActions(item)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
