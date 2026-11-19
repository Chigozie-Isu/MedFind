import type { Metadata } from 'next';
import { ComponentsShowcase } from './ComponentsShowcase';

export const metadata: Metadata = {
  title: 'Components · MedFind Pharmacy',
  robots: { index: false, follow: false },
};

/** Hidden screen (not linked anywhere): every shared component in light and dark, to compare with Figma. */
export default function ComponentsPage() {
  return <ComponentsShowcase />;
}
