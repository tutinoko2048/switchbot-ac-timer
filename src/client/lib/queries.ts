import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseResponse } from 'hono/client';
import { client } from '@/lib/api';
import type { Timer } from '@/types';

const REFETCH_INTERVAL = 10_000;

export const timersQuery = queryOptions({
  queryKey: ['timers'],
  queryFn: () => parseResponse(client.api.timers.$get()),
  refetchInterval: REFETCH_INTERVAL,
});

export const logsQuery = queryOptions({
  queryKey: ['logs'],
  queryFn: () => parseResponse(client.api.logs.$get()),
  refetchInterval: REFETCH_INTERVAL,
});

// デバイス一覧はほとんど変わらず、SwitchBot API の呼び出し回数にも上限があるので定期更新しない
export const devicesQuery = queryOptions({
  queryKey: ['devices'],
  queryFn: async () => {
    const data = await parseResponse(client.api.devices.$get());
    if (!data.body?.infraredRemoteList) {
      console.warn('No infrared devices found or API error', data);
      return [];
    }
    return data.body.infraredRemoteList;
  },
  staleTime: Infinity,
});

export type TimerInput = Pick<Timer, 'name' | 'time' | 'weekdays' | 'deviceId' | 'isActive'>;

function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: timersQuery.queryKey }),
      queryClient.invalidateQueries({ queryKey: logsQuery.queryKey }),
    ]);
}

export function useSaveTimer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: TimerInput }) =>
      id === undefined
        ? parseResponse(client.api.timers.$post({ json: input }))
        : parseResponse(client.api.timers[':id'].$put({ param: { id: id.toString() }, json: input })),
    onSuccess: invalidate,
  });
}

export function useDeleteTimer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => parseResponse(client.api.timers[':id'].$delete({ param: { id: id.toString() } })),
    onSuccess: invalidate,
  });
}

export function useTestTimer() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => parseResponse(client.api.timers[':id'].test.$post({ param: { id: id.toString() } })),
    onSettled: invalidate,
  });
}
