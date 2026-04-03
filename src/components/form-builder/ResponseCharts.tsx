import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { FormField, FormResponse } from '@/types/form';

interface ResponseChartsProps {
  readonly form: { readonly fields: readonly FormField[] };
  readonly responses: readonly FormResponse[];
  readonly isLoading?: boolean;
}

// Skeleton loader for individual chart cards
function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      {/* Title skeleton */}
      <div className="mb-4">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded mt-2" />
      </div>

      {/* Chart area skeleton */}
      <div className="h-64 flex items-center justify-center">
        <div className="relative">
          {/* Donut chart skeleton */}
          <div className="w-40 h-40 rounded-full border-[20px] border-gray-200 bg-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white" />
          </div>
        </div>
        {/* Legend skeleton */}
        <div className="ml-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="h-3 w-14 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-1/3 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
          <div className="h-3 w-10 bg-gray-100 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-1/4 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
          <div className="h-3 w-10 bg-gray-100 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-2/5 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
          <div className="h-3 w-10 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// Loading state with skeleton loaders
function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Chart skeletons grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

// Empty state when no analytics data is available
function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
          <BarChart3 className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-1">No analytics data available yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Analytics will appear here once users submit responses to questions with selectable options (radio buttons or checkboxes).
        </p>
      </div>
    </div>
  );
}

// Color palette for pie chart segments
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

interface ChartData {
  name: string;
  value: number;
  percentage: string;
}

interface FieldChartData {
  fieldId: string;
  fieldLabel: string;
  fieldType: 'radio' | 'checkbox';
  data: ChartData[];
  totalResponses: number;
}

export function ResponseCharts({ form, responses, isLoading = false }: ResponseChartsProps) {
  // Only process radio and checkbox fields (fields with discrete options)
  const chartableFields = useMemo(() => {
    return form.fields.filter(
      (field) => field.type === 'radio' || field.type === 'checkbox'
    );
  }, [form.fields]);

  // Build chart data for each chartable field
  const chartsData = useMemo<FieldChartData[]>(() => {
    return chartableFields.map((field) => {
      const optionCounts = new Map<string, number>();

      // Initialize counts for all options
      field.options?.forEach((opt) => {
        optionCounts.set(opt.label, 0);
      });

      // Count responses for each option
      responses.forEach((response) => {
        const answer = response.answers.find((a) => a.field_id === field.id);
        if (answer) {
          if (Array.isArray(answer.value)) {
            // Checkbox - multiple values
            answer.value.forEach((val) => {
              optionCounts.set(val, (optionCounts.get(val) || 0) + 1);
            });
          } else if (typeof answer.value === 'string' && answer.value) {
            // Radio - single value
            optionCounts.set(answer.value, (optionCounts.get(answer.value) || 0) + 1);
          }
        }
      });

      // Calculate total for percentages
      const totalCount = Array.from(optionCounts.values()).reduce((sum, count) => sum + count, 0);

      // Convert to chart data format
      const data: ChartData[] = Array.from(optionCounts.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : '0',
        }))
        .filter((item) => item.value > 0); // Only show options with responses

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type as 'radio' | 'checkbox',
        data,
        totalResponses: responses.length,
      };
    });
  }, [chartableFields, responses]);

  // Filter out fields with no responses
  const chartsWithData = chartsData.filter((chart) => chart.data.length > 0);

  // Show loading state while data is being fetched
  if (isLoading) {
    return <LoadingState />;
  }

  // Show empty state when no chartable data is available
  if (chartsWithData.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Response Analytics</h2>
        <span className="text-sm text-gray-500">
          ({chartsWithData.length} {chartsWithData.length === 1 ? 'chart' : 'charts'})
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {chartsWithData.map((chart) => (
          <div
            key={chart.fieldId}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 truncate" title={chart.fieldLabel}>
                {chart.fieldLabel}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {chart.fieldType === 'radio' ? 'Single choice' : 'Multiple choice'} •{' '}
                {chart.data.reduce((sum, d) => sum + d.value, 0)} responses
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ payload }) => `${(payload as ChartData).percentage}%`}
                    labelLine={false}
                  >
                    {chart.data.map((item) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[chart.data.indexOf(item) % COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${value} response${value === 1 ? '' : 's'}`,
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Data table below chart */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">Option</th>
                    <th className="pb-2 font-medium text-right">Count</th>
                    <th className="pb-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {chart.data.map((item, index) => (
                    <tr key={item.name} className="text-gray-700">
                      <td className="py-1.5 flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate" title={item.name}>
                          {item.name}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{item.value}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-500">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
