import { JSX } from 'preact';
import { signal } from '@preact/signals';

const title = signal('Ekilox');
const isMenuToggled = signal(false);
const leftNavbarElement = signal<JSX.Element | null>(null);
const rightNavbarElement = signal<JSX.Element | null>(null);
const leftFooterElement = signal<JSX.Element | null>(null);
const rightFooterElement = signal<JSX.Element | null>(null);

export {
  isMenuToggled,
  title,
  leftNavbarElement,
  rightNavbarElement,
  leftFooterElement,
  rightFooterElement,
};
