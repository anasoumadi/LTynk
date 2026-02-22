
import React from 'react';
import { TmxTag } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TmxTagChipProps {
  tag: TmxTag;
  className?: string;
}

export const TmxTagChip: React.FC<TmxTagChipProps> = ({ tag, className }) => {
  const label = tag.index ? `{${tag.index}}` : `{${tag.type.charAt(0).toUpperCase()}}`;
  return (
    <span
      contentEditable={false}
      data-tag-id={tag.id}
      data-tag-raw={tag.content}
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold",
        "bg-accent/20 text-accent border border-accent/30",
        className
      )}
      title={`${tag.type.toUpperCase()}: ${tag.content}`}
    >
      {label}
    </span>
  );
};

    
