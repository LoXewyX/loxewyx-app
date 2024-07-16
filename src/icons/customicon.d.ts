/// <reference types="preact" />

import { FC, JSX } from 'preact/compat';

export interface IconProps extends JSX.SVGAttributes<SVGElement> {
  color?: string;
  size?: string | number;
}

export type CustomIcon = FC<IconProps>;
