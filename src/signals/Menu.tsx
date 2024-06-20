import { Signal, signal } from '@preact/signals';
import { VNode } from 'preact';

const isMenuToggled: Signal<boolean> = signal(false);
const title: Signal<string> = signal('Ekilox');
const childElement: Signal<VNode | null> = signal(null);

export { isMenuToggled, title, childElement };
