# Nevermore Web

Web-based Bluetooth interface for [Nevermore](https://github.com/SanaaHamel/nevermore-controller) air filtration controllers.

## Features

- **Web Bluetooth API** - Connect directly to Nevermore controllers via Bluetooth
- **Real-time sensor monitoring** - Temperature, humidity, pressure, VOC index
- **Multi-device support** - Connect to multiple controllers simultaneously
- **GitHub Pages deployment** - Static site hosted for free
- **Modern tech stack** - SvelteKit + Svelte 5 with TypeScript

## Browser Support

- ✅ Chrome, Edge, Opera (Windows/macOS/Android)
- ❌ iOS/Safari (Web Bluetooth not supported)

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Type check
pnpm check

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── lib/
│   ├── bluetooth/
│   │   ├── BluetoothManager.svelte.ts      # Device connection management
│   │   ├── DeviceConnection.svelte.ts       # Per-device state
│   │   ├── characteristics/                 # Characteristic wrappers
│   │   ├── constants/                       # GATT UUIDs
│   │   ├── services/                        # Service implementations
│   │   └── utils/                           # Data parsers
│   └── components/                          # UI components
└── routes/                                  # SvelteKit routes
```

## Deployment

GitHub Actions automatically builds and deploys to GitHub Pages on push to main.

## Implementation Status

### Completed
- ✅ Project setup with SvelteKit + Svelte 5
- ✅ Web Bluetooth device connection
- ✅ Environmental Sensing service
- ✅ Real-time sensor data display
- ✅ Multi-device support
- ✅ GitHub Pages deployment workflow

### Planned
- ⏳ Fan control service
- ⏳ Fan policy configuration
- ⏳ NeoPixel control
- ⏳ Display settings
- ⏳ Servo control
- ⏳ Configuration management
- ⏳ Data visualization graphs
- ⏳ Device detail view

## Architecture

Built with Svelte 5 runes for reactive state management:

- **BluetoothManager** - Global singleton managing all devices
- **DeviceConnection** - Per-device state and service discovery
- **Service classes** - One per GATT service (Environmental, Fan, etc.)
- **Characteristic wrappers** - Abstract READ/WRITE/NOTIFY patterns

All Bluetooth state uses Svelte 5 `$state` runes for automatic reactivity.

## License

MIT
