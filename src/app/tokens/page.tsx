'use client';
import Navbar from '@/components/basic/Navbar';
import { ImportToken } from '@/components/wallet/Tokens';
import { useMessageBoxContext } from '@/providers/MessageBoxProvider';
import { formatFileUrl } from '@/utils/format';
import { Icon } from '@iconify/react';
import {
  Button,
  Image,
  Input,
  Listbox,
  ListboxItem,
  ListboxSection,
  Switch,
} from '@nextui-org/react';

export default function Tokens() {
  const { openModal } = useMessageBoxContext();
  async function handleAddToken() {
    await openModal({
      header: 'Add Custom Token',
      body: <ImportToken />,
    });
  }

  return (
    <div className="s-container">
      <Navbar className="mb-5">
        <div className="text-lg font-bold text-center">Tokens</div>
      </Navbar>
      <div className="mb-5">
        <Input
          placeholder="Search token"
          startContent={<Icon icon="eva:search-fill" className="text-default-500" />}
        />
      </div>
      <div>
        <Listbox aria-label=" ">
          <ListboxItem
            key="addCustomToken"
            className="mb-3"
            endContent={<Icon icon="eva:chevron-right-fill" className="text-lg " />}
            onClick={handleAddToken}
          >
            <span className="text-base">Add Custom Token</span>
          </ListboxItem>
          <ListboxSection title="Added Tokens">
            <ListboxItem
              key="near"
              endContent={<Switch color="primary" size="sm" defaultSelected />}
            >
              <div className="flex items-center gap-3">
                <Image src={formatFileUrl(`/assets/crypto/near.svg`)} width={30} height={30} />
                <span className="text-base">NEAR</span>
              </div>
            </ListboxItem>
          </ListboxSection>
        </Listbox>
      </div>
    </div>
  );
}
