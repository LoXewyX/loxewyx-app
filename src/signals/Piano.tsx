import { Signal, signal } from '@preact/signals';

export const pianoNotation: Signal<'unset' | 'english' | 'solfege'> = signal('unset');