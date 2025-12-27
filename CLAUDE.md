# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based Bluetooth interface for Nevermore air filtration controllers using Web Bluetooth API. Built with SvelteKit and deployed as a static site to GitHub Pages.

## Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Run dev server
pnpm check                # Type check with svelte-check
pnpm build                # Build for production
pnpm preview              # Preview production build
pnpm format               # Format all files with Prettier
pnpm format:check         # Check if files are formatted correctly
```

## Architecture

### Reactive State Management (Svelte 5 Runes)

The entire Bluetooth layer uses Svelte 5 `$state` runes (in `.svelte.ts` files) for universal reactivity:

- **BluetoothManager** (`BluetoothManager.svelte.ts`) - Global singleton managing device discovery and connection registry
- **DeviceConnection** (`DeviceConnection.svelte.ts`) - Per-device state, handles GATT connection/disconnection and service discovery
- **Service classes** (`services/`) - One class per GATT service (EnvironmentalSensing, Fan, Servo, etc.)
- **Characteristic wrappers** (`characteristics/BaseCharacteristic.svelte.ts`) - Abstract READ/WRITE/NOTIFY patterns with reactive state

All reactive state is declared with `$state`, making it automatically propagate to Svelte components.

### Bluetooth Data Flow

1. User triggers `BluetoothManager.requestDevice()` → Opens browser device picker
2. Device selected → Creates `DeviceConnection` instance → Auto-connects
3. Component calls `device.getService()` → Returns `BluetoothRemoteGATTService`
4. Service class created → `discover()` method fetches characteristics
5. Characteristics wrapped in `NotifyCharacteristic`, `WriteableCharacteristic`, or `ReadOnlyCharacteristic`
6. Data parsing/encoding handled by functions in `utils/parsers.ts`

### Characteristic Discovery Pattern

Some GATT characteristics share the same UUID (e.g., multiple Percentage8 characteristics in Fan service). To identify the correct one:

- Read the characteristic's user description descriptor (UUID: `00002901-0000-1000-8000-00805f9b34fb`)
- Match by description text (e.g., "Fan % - Override")
- See `Fan.svelte.ts` for implementation example

### BLE Data Format

All BLE values use little-endian encoding. Scalar format: `value = raw_value * M * 10^d * 2^b`

Key data types (defined in `parsers.ts`):

- **Percentage8**: `uint8_t`, multiply by 0.5, NOT_KNOWN=0xFF
- **Percentage16**: `uint16_t`, multiply by 0.01, NOT_KNOWN=0xFFFF
- **Temperature**: `int16_t`, multiply by 0.01, NOT_KNOWN=0x8000
- **Humidity**: `uint16_t`, multiply by 0.01, NOT_KNOWN=0xFFFF
- **Pressure**: `uint32_t`, multiply by 0.1, NOT_KNOWN=0xFFFFFFFF

### Static Site Configuration

Uses `@sveltejs/adapter-static` with:

- Base path: `/nevermore-web` (production only, configured in `svelte.config.js`)
- All routes prerendered (`+layout.js` has `export const prerender = true`)
- Static asset generation to `build/` directory
- Deployed via GitHub Actions to GitHub Pages

### Code Style

- **Indentation**: 4 spaces (2 spaces for package.json)
- **Formatter**: Prettier (enforced in CI)
- **TypeScript**: Strict mode enabled
- All files must be formatted before commit

## Key Files

- `src/lib/bluetooth/constants/uuids.ts` - All GATT service/characteristic UUIDs and NOT_KNOWN sentinel values
- `src/lib/bluetooth/utils/parsers.ts` - BLE data parsing/encoding functions
- `src/lib/bluetooth/characteristics/BaseCharacteristic.svelte.ts` - Base classes for characteristic access patterns
- `src/routes/+layout.js` - Configures prerendering for static site generation

## Browser Compatibility

Web Bluetooth API support:

- ✅ Chrome, Edge, Opera (Windows/macOS/Android)
- ❌ iOS/Safari (no Web Bluetooth support)

HTTPS required for Web Bluetooth (GitHub Pages provides this automatically).
