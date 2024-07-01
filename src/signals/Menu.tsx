import { VNode } from 'preact';
import { signal } from '@preact/signals';

const title = signal('Ekilox');
const isMenuToggled = signal(false);
const leftChildElement = signal<VNode | null>(null);
const rightChildElement = signal<VNode | null>(null);

export { isMenuToggled, title, leftChildElement, rightChildElement };
