import React from 'react';
import { BadgeCheck } from 'lucide-react';

export function Notice({ notice }) {
  return (
    <section className={`notice ${notice.type}`}>
      <BadgeCheck size={18} />
      <span>{notice.message}</span>
    </section>
  );
}
