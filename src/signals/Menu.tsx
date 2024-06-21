import { VNode } from 'preact';
import { Signal, signal } from '@preact/signals';

const isMenuToggled: Signal<boolean> = signal(false);
const title: Signal<string> = signal('Ekilox');
const leftChildElement: Signal<VNode | null> = signal(null);
const rightChildElement: Signal<VNode | null> = signal(null);

export { isMenuToggled, title, leftChildElement, rightChildElement };
