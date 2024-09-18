import { Spinner } from '@nextui-org/react';

type Props = {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  classNames?: Record<'base' | 'loading', string>;
  children?: React.ReactNode;
};
export default function Loading({ className, classNames, size, children, loading }: Props = {}) {
  return (
    <div className={`relative h-full ${classNames?.base ?? ''} ${className ?? ''}`}>
      {loading && (
        <Spinner
          className={
            children
              ? `absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                  classNames?.loading ?? ''
                }`
              : (classNames?.loading ?? '')
          }
          color="primary"
          size={size}
        />
      )}
      {children}
    </div>
  );
}
