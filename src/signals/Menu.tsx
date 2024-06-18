import { Signal, signal } from '@preact/signals';

const isMenuToggled: Signal<boolean> = signal(false);
const title: Signal<string> = signal('LoXewyX');

export { isMenuToggled, title };
