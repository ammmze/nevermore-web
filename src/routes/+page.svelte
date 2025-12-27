<script lang="ts">
	import { bluetoothManager } from '$lib/bluetooth/BluetoothManager.svelte';
	import DeviceCard from '$lib/components/DeviceCard.svelte';

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

<div class="container">
	<header>
		<h1>Nevermore Controller</h1>
		<p class="subtitle">Web Bluetooth interface for Nevermore air filtration controllers</p>
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
			{#if bluetoothManager.devices.size === 0}
				<div class="empty-state">
					<p>No devices connected</p>
					<p class="hint">Click "Connect Device" to pair with a Nevermore controller</p>
				</div>
			{:else}
				{#each Array.from(bluetoothManager.devices.values()) as device (device.id)}
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
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	header h1 {
		margin: 0;
		font-size: 2.5rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin-top: 0.5rem;
	}

	.error-banner {
		background: #fee;
		border: 2px solid #c00;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
	}

	.error-banner h2 {
		color: #c00;
		margin-top: 0;
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
		background: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.connect-button:hover:not(:disabled) {
		background: #0056b3;
	}

	.connect-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		color: #c00;
		background: #fdd;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-align: center;
	}

	.device-count {
		color: #666;
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
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.disconnect-button:hover {
		background: #c82333;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #888;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.9rem;
	}
</style>
