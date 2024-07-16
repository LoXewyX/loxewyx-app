# Ekilox Project Overview

Ekilox is built using **Tauri**, **Preact**, and **Typescript** with **Vite**.

## Recommended IDE Setup

To optimize your development environment, set up your IDE with:

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Frontend Development Guide

### Global Configurations

- **main.tsx**: Houses global configurations.

### Component Configurations

- **App.tsx**: Configuration specific to the main application component.

### Component Pages

- **components/**: Contains individual component pages.

#### Component Files ([component].tsx)

Each component starts with 100% height and is identified with ID="[component]".

#### Styling ([component].scss)

Nest all styles under #[component] to apply them exclusively to that component.

### Global Signals

- **signals/**: Global signaling modules.

#### DarkTheme.tsx

- **isDarkTheme**: Manages dark theme settings.

#### Menu.tsx

- **title**: Controls window and menu titles.
- **isMenuToggled**: Manages menu toggle state.
- **left[Nabvar | Footer]Element** and **right[Nabvar | Footer]Element**: Add elements to the left and right menu or footer respectively.

### Fragment Templates

- **templates/**: Contains reusable fragment templates.

#### Loading.tsx

- Fragment used for displaying loading indicators.

#### MenuBar.tsx

- Related to **signals/Menu.tsx**.

#### Sidebar.tsx

- Allows adding links using `const links: LinkProps[] = [...]`

### Custom Types

- **types/**: Custom TypeScript types.

## Installation

- `bun i`

## On developement

- `bun tauri dev`

## On build

- Enable on **main.tsx**:
  - `import DisableDevtool from 'disable-devtool';`
  - `DisableDevtool();`
- Add x86_64-pc-windows-msvc if you don't have intalled it already: `rustup target add i686-pc-windows-msvc`
- Run `bun tauri build --target i686-pc-windows-msvc`
- You'll find the project on `src-tauri/target/i686-pc-windows-msvc/release/bundle/`

## TODO: Documentate for Android build