import { VNode } from 'preact';
import { signal } from '@preact/signals';

const title = signal('Ekilox');
const isMenuToggled = signal(false);
const leftNavbarElement = signal<VNode | null>(null);
const rightNavbarElement = signal<VNode | null>(null);
const leftFooterElement = signal<VNode | null>(null);
const rightFooterElement = signal<VNode | null>(null);

export {
  isMenuToggled,
  title,
  leftNavbarElement,
  rightNavbarElement,
  leftFooterElement,
  rightFooterElement,
};
