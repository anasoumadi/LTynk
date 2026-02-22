# **App Name**: Heartfelt Editor

## Core Features:

- TMX File Opening: Opens and parses a TMX file from the user's local file system. Implements File System Access API where available, falling back to <input type='file'>.
- Virtualized Data Grid: Renders a large TMX file in a virtualized TanStack Table, supporting inline editing with tag protection (rendering XML tags as visual chips).
- Streaming XML Parsing: Parses XML files in a background Web Worker to avoid blocking the UI thread. The parser will leverage a tool for managing file sizes, which range from 1MB to 500MB, without causing UI freezes.
- Local Data Persistence: Uses Dexie.js to persist opened projects and TMX data in the browser's IndexedDB, enabling a local-first architecture.
- Find & Replace: Provides batch find and replace functionality, operating on a large number of records using Web Workers for background processing.
- TMX Export: Reconstructs and exports a valid TMX 1.4b XML file from the current state, allowing the user to download the updated file.
- Enhanced Command Palette: Modern 'Command Palette' (`Ctrl+K` using `cmdk` library) for improved app discoverability

## Style Guidelines:

- Primary color: Deep Indigo (#4F46E5) to convey a sense of focus and productivity.
- Background color: Light gray (#F9FAFB), providing a clean, non-distracting backdrop. 10% saturation from Indigo, adjusted for light scheme brightness.
- Accent color: Violet (#8B5CF6), used for interactive elements and highlights to draw attention.
- Body and headline font: 'Inter', a sans-serif font, selected for a neutral and modern aesthetic suitable for both headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use crisp SVG vector icons from Lucide React for a clean and modern look.
- Maintain a compact, high-density layout, minimizing whitespace to maximize information display. Use Tailwind's text-sm or text-xs for interface elements.
- Use subtle animations and transitions for a polished user experience.