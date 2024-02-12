import {
  alpha,
  lighten,
  darken,
  PaletteOptions,
  PaletteColorOptions,
  ThemeOptions,
  createTheme,
} from '@mui/material/styles';
import _ from 'lodash';

import { typography } from './typography';

const common = {
  typography,
};

// https://mui.com/material-ui/customization/theming/#typescript
declare module '@mui/material/styles' {
  interface PaletteOptions {
    accent: PaletteColorOptions;
    selectedOption?: {
      background: string;
      text: string;
    };
    toolbar?: {
      background: string;
      text: string;
    };
  }

  interface TypeText {
    code: {
      main: string;
      border: string;
    };
  }
}

// Generate these palettes with https://zenoo.github.io/mui-theme-creator/

export const _lightPaletteOptions: PaletteOptions = {
  mode: 'light',
  primary: {
    // main: '#E4F4F9', // bubbles
    // main: '#387CF7', // bleu de France
    // main: '#6C8BDA', // blue-gray / cornflower
    main: '#517BE8', // royal blue
  },
  secondary: {
    // main: '#8F67CF', // amethyst
    // main: '#6C8BDA', // blue-gray / cornflower
    main: '#8DF2D4', // medium aquamarine / magic mint
  },
  background: {
    default: '#FCFAF3', // Floral white
    // paper: lighten('#EBE5D8', 0.9), // Eggshell
    paper: '#F8F7F4', // Cultured / white smoke
  },
  accent: {
    main: '#F4E174', // Jasmine
  },
  text: {
    primary: '#111111',
  },
};

const _darkPaletteOptions: PaletteOptions = {
  mode: 'dark',
  primary: {
    // main: '#79DE0D', // lawn green
    main: lighten('#6C8BDA', 0.2), // blue-gray / cornflower
  },
  secondary: {
    // main: '#D584E7', // violet
    // main: '#7067CF', // slate blue
    main: '#8DF2D4', // medium aquamarine / magic mint
  },
  background: {
    default: '#111111', // smoky black
    paper: '#212121', // raisin black
  },
  accent: {
    main: '#F4E174', // Jasmine
  },
  text: {
    primary: '#FFFFFF',
  },
};

const _lightThemeOptions: ThemeOptions = { palette: _lightPaletteOptions, ...common };
const _darkThemeOptions: ThemeOptions = { palette: _darkPaletteOptions, ...common };

const _light = createTheme(_lightThemeOptions);
const _dark = createTheme(_darkThemeOptions);

/////////////////////////////////////////////////////////////////////////////
// Based colours are now defined, so we can derive further semantic color
// tokens from those.
/////////////////////////////////////////////////////////////////////////////

// We could also use a nested partial with the following trick from
// https://stackoverflow.com/a/47914631/179332
//
// type RecursivePartial<T> = {
//   [P in keyof T]?: RecursivePartial<T[P]>;
// };
//
// const _lightThemeExtraThemeOptions: RecursivePartial<ThemeOptions> = {
//   palette: {
//     ...
//   },
// };

const _lightThemeExtraPaletteOptions: Partial<PaletteOptions> = {
  selectedOption: {
    text: '#111111',
    background: _light.palette.secondary.main,
  },
  toolbar: {
    text: '#111111', // smoky black
    background: '#EBE5D8', // Eggshell
  },
  text: {
    code: {
      main: _light.palette.primary.dark,
      border: alpha(_light.palette.primary.light, 0.5),
    },
  },
};

const _darkThemeExtraPaletteOptions: Partial<PaletteOptions> = {
  selectedOption: {
    text: '#FFFFFF',
    background: darken(_dark.palette.secondary.dark, 0.2),
  },
  toolbar: {
    text: '#FFFFFF',
    background: '#111111',
  },
  text: {
    code: {
      main: _dark.palette.secondary.light,
      border: alpha(_dark.palette.secondary.dark, 0.5),
    },
  },
};

export const lightThemeOptions: ThemeOptions = _.merge(
  _lightThemeOptions,
  { palette: _lightThemeExtraPaletteOptions },
  // _lightThemeExtraThemeOptions,
);
export const darkThemeOptions: ThemeOptions = _.merge(
  _darkThemeOptions,
  { palette: _darkThemeExtraPaletteOptions },
  // _darkThemeExtraThemeOptions,
);

export const themes = {
  light: createTheme(lightThemeOptions),
  dark: createTheme(darkThemeOptions),
};

export type ThemeName = keyof typeof themes;
