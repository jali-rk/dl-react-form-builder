import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Link2,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formsApi } from '@/api/formsApi';
import type { FormTemplate, FormStatus } from '@/types/form';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function FormsPage() {
  const navigate = useNavigate();

  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormTemplate | null>(null);
  const [deletingBulk, setDeletingBulk] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await formsApi.list({ search, status: statusFilter, page, pageSize });
      setForms(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    void fetchForms();
  }, [fetchForms]);

  /* ---- Selection ---- */
  const allSelected = forms.length > 0 && forms.every((f) => selectedIds.has(f.id));
  const someSelected = forms.some((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        forms.forEach((f) => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        forms.forEach((f) => next.add(f.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ---- Actions ---- */
  const handleToggleStatus = async (form: FormTemplate) => {
    await formsApi.toggleStatus(form.id);
    void fetchForms();
  };

  const handleDuplicate = async (id: string) => {
    await formsApi.duplicate(id);
    void fetchForms();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await formsApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    void fetchForms();
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    await Promise.all([...selectedIds].map((id) => formsApi.delete(id)));
    setSelectedIds(new Set());
    setDeletingBulk(false);
    void fetchForms();
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/forms/view/${id}`).catch(() => {});
  };

  /* ---- Pagination ---- */
  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <Button onClick={() => navigate('/admin/forms/new')} className="gap-2">
          Create New Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as FormStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {someSelected && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deletingBulk}
            className="ml-auto"
          >
            {deletingBulk ? 'Deleting...' : `Delete ${selectedIds.size} selected`}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 flex items-center justify-center px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className={someSelected && !allSelected ? 'opacity-50' : ''}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Forms</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-36">Type</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-16">View</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-28">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : forms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    No forms found.{' '}
                    <button
                      onClick={() => navigate('/admin/forms/new')}
                      className="text-gray-900 underline underline-offset-2"
                    >
                      Create one
                    </button>
                  </td>
                </tr>
              ) : (
                forms.map((form, i) => (
                  <tr
                    key={form.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(form.id)}
                        onCheckedChange={() => toggleOne(form.id)}
                        aria-label={`Select ${form.name}`}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-gray-900">{form.name}</td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <Select defaultValue={form.type} onValueChange={async (v) => {
                        await formsApi.update(form.id, { type: v as 'Public' | 'Private' });
                        void fetchForms();
                      }}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">Public</SelectItem>
                          <SelectItem value="Private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* View */}
                    <td className="px-4 py-3 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => navigate(`/admin/forms/view/${form.id}`)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 mx-auto"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Preview form</TooltipContent>
                      </Tooltip>
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-500">
                          {form.status === 'published' ? (
                            <Badge variant="success">Publish</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </span>
                        <Switch
                          checked={form.status === 'published'}
                          onCheckedChange={() => handleToggleStatus(form)}
                          className="scale-75"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDuplicate(form.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => navigate(`/admin/forms/edit/${form.id}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setDeleteTarget(form)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => handleCopyLink(form.id)}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Copy Link
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => navigate(`/admin/forms/responses/${form.id}`)}
                        >
                          <BarChart2 className="h-3.5 w-3.5" />
                          View Responses
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${total} row(s) selected.`
              : `${total} row(s) total.`}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
