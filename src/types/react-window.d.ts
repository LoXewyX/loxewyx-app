///<reference path="react-window.d.ts" />

declare module 'react-window' {
    import { CSSProperties } from 'preact/compat';
  
    interface FixedSizeListProps {
      height: number;
      width: string | number;
      itemCount: number;
      itemSize: number;
      children: (props: {
        index: number;
        style: CSSProperties;
      }) => React.ReactNode;
    }

    export interface RendererProps {
        index: number;
        style: CSSProperties;
      }
  
    export const FixedSizeList: preact.ComponentType<FixedSizeListProps>;
  }
  