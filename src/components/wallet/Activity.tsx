import { useInfiniteScroll, useRequest } from '@/hooks/useHooks';
import Empty from '../basic/Empty';
import { useState } from 'react';
import { transactionServices } from '@/services/tranction';
import Loading from '../basic/Loading';
import dayjs from 'dayjs';

export default function Activity({ address }: { address?: string }) {
  const [txs, setTxs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const { loading } = useRequest(() => transactionServices.btcTxsHistory({ page, pageSize }), {
    refreshDeps: [page],
    onSuccess(res) {
      setTxs((prev) => (page === 1 ? res : [...prev, ...res]));
      setHasMore(res.length === pageSize);
    },
  });

  function loadMore() {
    if (loading) return;
    setPage(page + 1);
  }

  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore: loadMore,
    distance: 50,
  });

  return (
    <div ref={scrollerRef as any} className="w-full">
      {txs.length ? (
        txs.map((tx, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-4 border-b border-default-200"
          >
            <div className="flex items-center">
              <img src={tx.icon} alt="" className="w-8 h-8 mr-4" />
              <div>
                <div className="text-default-900">{tx.NearHash}</div>
                <div className="text-default-500">
                  {dayjs(tx.UpdateTime * 1000).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </div>
            <div className="text-default-900">{tx.amount}</div>
          </div>
        ))
      ) : (
        <Empty />
      )}
      <div ref={loaderRef as any} className="flex justify-center py-4">
        <Loading size="sm" loading={loading} />
      </div>
    </div>
  );
}
