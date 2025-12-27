<script lang="ts">
	import { bluetoothManager } from '$lib/bluetooth/BluetoothManager.svelte';
	import DeviceCard from '$lib/components/DeviceCard.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';

	async function connectDevice() {
		await bluetoothManager.requestDevice();
	}

	function disconnectDevice(id: string) {
		bluetoothManager.disconnectDevice(id);
	}
</script>

<svelte:head>
	<title>Nevermore Controller</title>
</svelte:head>

<div class="container" class:dark={themeStore.isDark}>
	<header>
		<div class="header-content">
			<div class="header-text">
				<h1>Nevermore Controller</h1>
				<p class="subtitle">Web Bluetooth interface for Nevermore air filtration controllers</p>
			</div>
			<ThemeToggle />
		</div>
	</header>

	{#if !bluetoothManager.isSupported}
		<div class="error-banner">
			<h2>Web Bluetooth Not Supported</h2>
			<p>
				Your browser doesn't support the Web Bluetooth API. Please use Chrome, Edge, or Opera on
				Windows, macOS, or Android.
			</p>
			<p><strong>Note:</strong> iOS and Safari do not support Web Bluetooth.</p>
		</div>
	{:else}
		<div class="controls">
			<button onclick={connectDevice} disabled={bluetoothManager.isScanning} class="connect-button">
				{bluetoothManager.isScanning ? 'Scanning...' : 'Connect Device'}
			</button>

			{#if bluetoothManager.error}
				<div class="error">{bluetoothManager.error}</div>
			{/if}

			{#if bluetoothManager.connectedCount > 0}
				<p class="device-count">
					Connected devices: {bluetoothManager.connectedCount} / {bluetoothManager.deviceCount}
				</p>
			{/if}
		</div>

		<div class="devices">
			{#if bluetoothManager.devices.length === 0}
				<div class="empty-state">
					<p>No devices connected</p>
					<p class="hint">Click "Connect Device" to pair with a Nevermore controller</p>
				</div>
			{:else}
				{#each bluetoothManager.devices as device (device.id)}
					<div class="device-wrapper">
						<DeviceCard {device} />
						<button onclick={() => disconnectDevice(device.id)} class="disconnect-button">
							Disconnect
						</button>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
		background: #f5f5f5;
		transition: background 0.3s;
	}

	:global(body.dark) {
		background: #1a1a1a;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		--bg-color: #fff;
		--text-color: #333;
		--text-muted: #666;
		--border-color: #ccc;
		--hover-bg: #f0f0f0;
		--error-bg: #fdd;
		--error-color: #c00;
		--error-border: #c00;
		--success-bg: #dfd;
		--success-color: #0a0;
		--card-bg: #fff;
		--sensor-bg: #f8f8f8;
		--button-bg: #007bff;
		--button-hover: #0056b3;
		--disconnect-bg: #dc3545;
		--disconnect-hover: #c82333;
	}

	.container.dark {
		--bg-color: #2a2a2a;
		--text-color: #e0e0e0;
		--text-muted: #999;
		--border-color: #444;
		--hover-bg: #333;
		--error-bg: #3a1a1a;
		--error-color: #ff6b6b;
		--error-border: #8b0000;
		--success-bg: #1a3a1a;
		--success-color: #6bff6b;
		--card-bg: #2a2a2a;
		--sensor-bg: #222;
		--button-bg: #0d6efd;
		--button-hover: #0b5ed7;
		--disconnect-bg: #dc3545;
		--disconnect-hover: #bb2d3b;
	}

	header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-text {
		flex: 1;
		text-align: center;
	}

	header h1 {
		margin: 0;
		font-size: 2.5rem;
		color: var(--text-color);
	}

	.subtitle {
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	.error-banner {
		background: var(--error-bg);
		border: 2px solid var(--error-border);
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
	}

	.error-banner h2 {
		color: var(--error-color);
		margin-top: 0;
	}

	.error-banner p {
		color: var(--text-color);
	}

	.controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.connect-button {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		background: var(--button-bg);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.connect-button:hover:not(:disabled) {
		background: var(--button-hover);
	}

	.connect-button:disabled {
		background: var(--border-color);
		cursor: not-allowed;
	}

	.error {
		color: var(--error-color);
		background: var(--error-bg);
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-align: center;
	}

	.device-count {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.devices {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.device-wrapper {
		position: relative;
	}

	.disconnect-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem 1rem;
		background: var(--disconnect-bg);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.disconnect-button:hover {
		background: var(--disconnect-hover);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-muted);
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.9rem;
	}
</style>
