import { useInfiniteScroll, useRequest } from '@/hooks/useHooks';
import Empty from '../basic/Empty';
import { useCallback, useRef, useState } from 'react';
import { RawTransaction, transactionServices } from '@/services/tranction';
import Loading from '../basic/Loading';
import dayjs from 'dayjs';
import { formatExplorerUrl, formatSortAddress } from '@/utils/format';
import { Chip, ChipProps, Link } from '@nextui-org/react';

export default function Activity({ address }: { address?: string }) {
  const [txs, setTxs] = useState<RawTransaction[]>([]);
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

  useInfiniteScroll({
    hasMore,
    onLoadMore: loadMore,
    distance: 50,
  });

  const Status = useCallback((data: RawTransaction) => {
    const props = {
      variant: 'flat',
      size: 'sm',
      classNames: { base: 'h-5', content: 'text-xs' },
    } as ChipProps;
    switch (data.Status) {
      case 101:
      case 102:
        return (
          <Chip color="danger" {...props}>
            Failed
          </Chip>
        );
      case 3:
        return null;
      // return (
      //   <Chip color="success" {...props}>
      //     Success
      //   </Chip>
      // );
      default:
        return (
          <Chip color="warning" {...props}>
            Pending
          </Chip>
        );
    }
  }, []);

  return (
    <div className="w-full">
      {txs.length ? (
        txs.map((tx, index) => (
          <div key={index} className="card mb-3">
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-base">Contract Call</span>
                  {Status(tx)}
                </div>
                <div className="text-default-500 text-xs">
                  {dayjs(tx.UpdateTime * 1000).format('YYYY/MM/DD HH:mm:ss')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {tx.NearHash && (
                  <Link
                    className="text-default-500"
                    href={formatExplorerUrl(tx.NearHash)}
                    showAnchorIcon
                    isExternal
                    size="sm"
                  >
                    {formatSortAddress(tx.NearHash)}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <Empty />
      )}
      <div className="flex justify-center py-4">
        <Loading size="sm" loading={loading} />
      </div>
    </div>
  );
}
