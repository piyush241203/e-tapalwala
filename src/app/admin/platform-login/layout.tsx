import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal',
  robots: 'noindex, nofollow', // Never indexed by search engines
};

export default function PlatformLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
