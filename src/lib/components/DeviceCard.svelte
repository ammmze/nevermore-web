<script lang="ts">
	import type { DeviceConnection } from '$lib/bluetooth/DeviceConnection.svelte';
	import { EnvironmentalSensing } from '$lib/bluetooth/services/EnvironmentalSensing.svelte';
	import { SERVICES, toUuidString } from '$lib/bluetooth/constants/uuids';

	let { device }: { device: DeviceConnection } = $props();

	let environmental = $state<EnvironmentalSensing | null>(null);
	let loading = $state(false);

	async function loadServices() {
		loading = true;
		try {
			// Load environmental sensing service
			const service = await device.getService(toUuidString(SERVICES.ENVIRONMENTAL_SENSING));
			if (service) {
				environmental = new EnvironmentalSensing(service);
				await environmental.discover();
			}
		} catch (e) {
			console.error('Error loading services:', e);
		} finally {
			loading = false;
		}
	}

	// Load services when device connects
	$effect(() => {
		if (device.connected && !environmental && !loading) {
			loadServices();
		}
	});
</script>

<div class="device-card">
	<div class="device-header">
		<h2>{device.name}</h2>
		<span class="status {device.connected ? 'connected' : 'disconnected'}">
			{device.connected ? '● Connected' : '○ Disconnected'}
		</span>
	</div>

	{#if device.error}
		<div class="error">{device.error}</div>
	{/if}

	{#if device.connected && environmental}
		<div class="sensors">
			<h3>Environmental Sensors</h3>

			{#if environmental.aggregate?.value}
				{@const data = environmental.aggregate.value}

				<div class="sensor-grid">
					{#if data.temperatureIntake !== null}
						<div class="sensor-reading">
							<span class="label">Intake Temp</span>
							<span class="value">{data.temperatureIntake.toFixed(1)}°C</span>
						</div>
					{/if}

					{#if data.temperatureExhaust !== null}
						<div class="sensor-reading">
							<span class="label">Exhaust Temp</span>
							<span class="value">{data.temperatureExhaust.toFixed(1)}°C</span>
						</div>
					{/if}

					{#if data.humidityIntake !== null}
						<div class="sensor-reading">
							<span class="label">Intake Humidity</span>
							<span class="value">{data.humidityIntake.toFixed(1)}%</span>
						</div>
					{/if}

					{#if data.humidityExhaust !== null}
						<div class="sensor-reading">
							<span class="label">Exhaust Humidity</span>
							<span class="value">{data.humidityExhaust.toFixed(1)}%</span>
						</div>
					{/if}

					{#if data.vocIndexIntake !== null}
						<div class="sensor-reading">
							<span class="label">Intake VOC</span>
							<span class="value">{data.vocIndexIntake}</span>
						</div>
					{/if}

					{#if data.vocIndexExhaust !== null}
						<div class="sensor-reading">
							<span class="label">Exhaust VOC</span>
							<span class="value">{data.vocIndexExhaust}</span>
						</div>
					{/if}
				</div>

				{#if environmental.aggregate.lastUpdate}
					<div class="last-update">
						Last update: {environmental.aggregate.lastUpdate.toLocaleTimeString()}
					</div>
				{/if}
			{:else if loading}
				<p>Loading sensors...</p>
			{:else}
				<p>Waiting for sensor data...</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.device-card {
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		background: #fff;
	}

	.device-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.device-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.status {
		font-size: 0.9rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.status.connected {
		color: #0a0;
		background: #dfd;
	}

	.status.disconnected {
		color: #888;
		background: #f0f0f0;
	}

	.error {
		color: #c00;
		background: #fdd;
		padding: 0.5rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.sensors h3 {
		margin-top: 0;
		font-size: 1.2rem;
	}

	.sensor-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.sensor-reading {
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		background: #f8f8f8;
		border-radius: 4px;
	}

	.sensor-reading .label {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.sensor-reading .value {
		font-size: 1.5rem;
		font-weight: 600;
		color: #333;
	}

	.last-update {
		font-size: 0.85rem;
		color: #888;
		font-style: italic;
	}
</style>
