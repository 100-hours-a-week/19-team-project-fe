'use client';

import type { SimpleItem } from '@/features/resume';
import { inlineFieldClass } from './constants';

type SimpleItemsSectionProps = {
  title: string;
  items: SimpleItem[];
  onAdd: () => void;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  removeAriaLabel: string;
  addLabel: string;
};

export function SimpleItemsSection({
  title,
  items,
  onAdd,
  onUpdate,
  onRemove,
  removeAriaLabel,
  addLabel,
}: SimpleItemsSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card-soft">
        {items.map((item, index) => (
          <div key={item.id} className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''}`}>
            <input
              placeholder="텍스트를 입력해 주세요."
              value={item.value}
              onChange={(event) => onUpdate(item.id, event.target.value)}
              className={`${inlineFieldClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
              aria-label={removeAriaLabel}
            >
              -
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
        >
          {addLabel}
        </button>
      </div>
    </section>
  );
}
