import type { Metadata } from 'next';
import KindleClient from './KindleClient';

export const metadata: Metadata = {
  title: 'Kindle Lite',
  description: 'Read-only ultra-light Obelisk prototype for Kindle browsers.',
  alternates: { canonical: '/kindle' },
};

export default function KindlePage() {
  return <KindleClient />;
}

