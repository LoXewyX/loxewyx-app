import { invoke } from '@tauri-apps/api/core';
import { FunctionalComponent } from 'preact';
import { useMemo, useCallback } from 'preact/hooks';
import { signal, useSignalEffect } from '@preact/signals';
import { Howl } from 'howler';
import { Zap, ZapOff } from 'react-feather';
import { title, rightChildElement, leftChildElement } from '../signals/Menu';
import { pianoNotation } from '../signals/Piano';
import './Piano.scss';

const activeNote = signal<string>('');
const activeNotes = signal<Set<string>>(new Set());
const mouseDown = signal(false);
const midiDevices = signal<WebMidi.MIDIInput[]>([]);
const currentDevice = signal('');

const noteNames = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const generateNoteSequence = (
  minOctave: number,
  maxOctave: number
): string[] => {
  const octaveNotes: string[] = [];
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    for (let i = 0; i < noteNames.length; i++) {
      const note = `${noteNames[i]}${octave}`;
      octaveNotes.push(note);
      if (octave === maxOctave && i === noteNames.length - 1) break;
    }
  }
  return octaveNotes;
};

const calculateKeyColor = (note: string): string =>
  note.includes('#') ? 'black' : 'white';

const LeftMenuElement: FunctionalComponent = () => {
  const onPianoNotationChange = useCallback(async (event: Event) => {
    const newNotation = (event.target as HTMLSelectElement).value;
    try {
      await invoke('set_config', {
        key: 'pianoNotation',
        value: newNotation,
      });

      pianoNotation.value =
        newNotation === 'unset' ||
        newNotation === 'english' ||
        newNotation === 'solfege'
          ? newNotation
          : 'unset';
    } catch (e) {
      console.error('Error setting piano notation:', e);
    }
  }, []);

  useSignalEffect(() => {
    const fetchPianoNotation = async () => {
      try {
        const notation = (await invoke('get_config', {
          key: 'pianoNotation',
        })) as string;

        pianoNotation.value =
          notation === 'unset' ||
          notation === 'english' ||
          notation === 'solfege'
            ? notation
            : 'unset';
      } catch (e) {
        console.error('Error fetching piano notation:', e);
      }
    };

    fetchPianoNotation();
  });

  return (
    <select
      value={pianoNotation.value}
      onChange={onPianoNotationChange}
      className='block appearance-none bg-black-2 outline-none h-[28px] rounded px-2 ml-2'
    >
      <option value='unset'>Unset</option>
      <option value='english'>English</option>
      <option value='solfege'>Solfege</option>
    </select>
  );
};

const RightMenuElement: FunctionalComponent = () => {
  return (
    <div className='flex'>
      {!!currentDevice.value ? (
        <>
          <Zap className='mr-2' />
          {currentDevice.value}
        </>
      ) : (
        <>
          <ZapOff className='mr-2' />
          No MIDI found
        </>
      )}
    </div>
  );
};

interface KeyProps {
  note: string;
  midiNoteNumber: number;
  playNote: (midiNoteNumber: number, volume: number) => void;
  isActive: boolean;
  onMouseDown: (note: string) => void;
  onMouseUp: (note: string) => void;
  onMouseEnter: (note: string) => void;
}

const Key: FunctionalComponent<KeyProps> = ({
  note,
  midiNoteNumber,
  playNote,
  isActive,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
}) => {
  const handleMouseDown = useCallback(() => {
    onMouseDown(note);
    playNote(midiNoteNumber, 0.8);
  }, [playNote, midiNoteNumber, note, onMouseDown]);
  const handleMouseUp = useCallback(() => onMouseUp(note), [note, onMouseUp]);
  const handleMouseEnter = useCallback(
    () => onMouseEnter(note),
    [note, onMouseEnter]
  );

  const getSolfegeNote = (note: string): string => {
    const noteToSolfege: { [key: string]: string } = {
      C: 'Do',
      'C#': 'Do#',
      D: 'Re',
      'D#': 'Re#',
      E: 'Mi',
      F: 'Fa',
      'F#': 'Fa#',
      G: 'Sol',
      'G#': 'Sol#',
      A: 'La',
      'A#': 'La#',
      B: 'Si',
    };

    const noteName = note.slice(0, -1);
    const octave = note.slice(-1);
    return `${noteToSolfege[noteName]}${octave}`;
  };

  return (
    <div
      className={`key ${calculateKeyColor(note)} ${isActive ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
    >
      {pianoNotation.value !== 'unset' ? (
        <span className='note-label'>
          {pianoNotation.value === 'solfege' ? getSolfegeNote(note) : note}
        </span>
      ) : (
        <></>
      )}
    </div>
  );
};

const Piano: FunctionalComponent = () => {
  const octaveNotes = useMemo(() => generateNoteSequence(4, 5), []);

  const playNote = useCallback((midiNoteNumber: number, volume: number) => {
    new Howl({
      src: ['/snd/piano.mp3'],
      rate: Math.pow(2, (midiNoteNumber - 60) / 12),
      volume,
    }).play();
  }, []);

  const addActiveNote = useCallback((note: string) => {
    activeNotes.value = new Set(activeNotes.value).add(note);
    activeNote.value = note;
  }, []);

  const removeActiveNote = useCallback((note: string) => {
    const newActiveNotes = new Set(activeNotes.value);
    newActiveNotes.delete(note);
    activeNotes.value = newActiveNotes;
    activeNote.value = '';
  }, []);

  useSignalEffect(() => {
    title.value = 'Piano';

    (async (): Promise<string> => {
      try {
        return (
          (await invoke('get_config', { key: 'pianoNotation' })) ?? 'unset'
        );
      } catch (e) {
        console.error('Error fetching piano notation:', e);
        return 'unset';
      }
    })().then((notation) => {
      pianoNotation.value =
        notation === 'english' || notation === 'solfege' ? notation : 'unset';
    });

    leftChildElement.value = <LeftMenuElement />;
    rightChildElement.value = <RightMenuElement />;

    function handleMIDIMessage(event: WebMidi.MIDIMessageEvent) {
      const [command, note, velocity] = event.data;
      const noteName = `${noteNames[note % 12]}${Math.floor(note / 12)}`;

      if (command === 144 && velocity > 0) {
        addActiveNote(noteName);
        playNote(note, velocity / 127);
      } else if (command === 128 || (command === 144 && velocity === 0)) {
        removeActiveNote(noteName);
      }
    }

    function updateMIDIDevices(midiAccess: WebMidi.MIDIAccess) {
      midiDevices.value = Array.from(midiAccess.inputs.values());
      if (midiDevices.value.length > 0) {
        currentDevice.value = midiDevices.value[0].name || 'Unknown Device';
        midiDevices.value.forEach((input) => {
          input.onmidimessage = handleMIDIMessage;
        });
      } else {
        currentDevice.value = '';
      }
    }

    navigator.requestMIDIAccess?.().then((midiAccess) => {
      updateMIDIDevices(midiAccess);

      midiAccess.onstatechange = () => updateMIDIDevices(midiAccess);
    });

    return () => {
      navigator.requestMIDIAccess?.().then((midiAccess) => {
        midiAccess.inputs.forEach((input) => (input.onmidimessage = null));
      });
    };
  });

  const mapNoteToMidiNumber = (note: string): number => {
    const noteIndex = noteNames.indexOf(note.slice(0, -1));
    const octave = parseInt(note.slice(-1));
    return octave * 12 + noteIndex;
  };

  const handleMouseDown = useCallback(
    (note: string) => {
      mouseDown.value = true;
      addActiveNote(note);
    },
    [addActiveNote]
  );

  const handleMouseUp = useCallback(() => {
    mouseDown.value = false;
    activeNotes.value = new Set();
    activeNote.value = '';
  }, []);

  const handleMouseEnter = useCallback(
    (note: string) => {
      if (mouseDown.value) {
        addActiveNote(note);
        playNote(mapNoteToMidiNumber(note), 0.8);
      }
    },
    [mouseDown, playNote, addActiveNote]
  );

  useSignalEffect(() => {
    if (mouseDown.value) {
      const handleMouseUpDocument = () => handleMouseUp();
      document.addEventListener('mouseup', handleMouseUpDocument);
      return () =>
        document.removeEventListener('mouseup', handleMouseUpDocument);
    }
  });

  useSignalEffect(() => {
    const keyToNoteMap: { [key: string]: string } = {
      Digit2: 'C#5',
      Digit3: 'D#5',
      Digit5: 'F#5',
      Digit6: 'G#5',
      Digit7: 'A#5',
      Digit9: 'C#6',
      Digit0: 'D#6',
      Equal: 'F#6',
      KeyQ: 'C5',
      KeyW: 'D5',
      KeyE: 'E5',
      KeyR: 'F5',
      KeyT: 'G5',
      KeyY: 'A5',
      KeyU: 'B5',
      KeyI: 'C6',
      KeyO: 'D6',
      KeyP: 'E6',
      BracketLeft: 'F6',
      BracketRight: 'G6',
      KeyS: 'C#4',
      KeyD: 'D#4',
      KeyG: 'F#4',
      KeyH: 'G#4',
      KeyJ: 'A#4',
      KeyL: 'C#5',
      Semicolon: 'D#5',
      KeyZ: 'C4',
      KeyX: 'D4',
      KeyC: 'E4',
      KeyV: 'F4',
      KeyB: 'G4',
      KeyN: 'A4',
      KeyM: 'B4',
      Comma: 'C5',
      Period: 'D5',
      Slash: 'E5',
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const note = keyToNoteMap[event.code];
      if (note) {
        addActiveNote(note);
        playNote(mapNoteToMidiNumber(note), 0.8);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const note = keyToNoteMap[event.code];
      if (note) {
        removeActiveNote(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  return (
    <div className='flex items-center h-full'>
      <div className='flex w-full justify-center'>
        {octaveNotes.map((note) => (
          <Key
            note={note}
            midiNoteNumber={mapNoteToMidiNumber(note)}
            playNote={playNote}
            isActive={activeNotes.value.has(note)}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
          />
        ))}
      </div>
    </div>
  );
};

export default Piano;
