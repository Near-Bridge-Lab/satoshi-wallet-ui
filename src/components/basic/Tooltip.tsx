import { useMessageBoxContext } from '@/providers/MessageBoxProvider';
import { Tooltip as _Tooltip, type TooltipProps } from '@nextui-org/react';

interface Props extends TooltipProps {
  disableMobile?: boolean;
}

export default function Tooltip({
  className,
  content,
  children,
  disableMobile,
  ...params
}: Props = {}) {
  const { alert } = useMessageBoxContext();

  function handleClick() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    if (isMobile && !disableMobile) {
      alert(content);
    }
  }
  return (
    <_Tooltip content={content} {...params}>
      <span className={`cursor-pointer ${className || ''}`} onClick={handleClick}>
        {children}
      </span>
    </_Tooltip>
  );
}
