import { Signal, signal } from '@preact/signals';

const pianoNotation: Signal<'unset' | 'english' | 'solfege'> = signal('unset');
const octaveRange = signal<[number, number]>([4, 5]);

export { pianoNotation, octaveRange };