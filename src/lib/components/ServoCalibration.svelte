<script lang="ts">
    import CalibrationAdjuster from './CalibrationAdjuster.svelte';
    import KlipperConfigPreview from './KlipperConfigPreview.svelte';
    import SensorReading from './SensorReading.svelte';
    import SensorGroup from './SensorGroup.svelte';

    let {
        minDutyMs = $bindable(),
        maxDutyMs = $bindable(),
        currentPosition,
        servoPeriodMs = 20,
        onAdjustMin,
        onAdjustMax,
        onTestMin,
        onTestMax,
        onSwap
    }: {
        minDutyMs: number;
        maxDutyMs: number;
        currentPosition: number | null | undefined;
        servoPeriodMs?: number;
        onAdjustMin: (delta: number) => void;
        onAdjustMax: (delta: number) => void;
        onTestMin: () => void;
        onTestMax: () => void;
        onSwap: () => void;
    } = $props();

    function dutyToPercentage(dutyMs: number): number {
        return (dutyMs / servoPeriodMs) * 100;
    }
</script>

<div class="calibration-mode">
    <p class="calibration-hint">
        Adjust duty cycle values to calibrate servo range. Use test buttons to verify positions.
    </p>

    <CalibrationAdjuster
        label="Minimum Position (0%)"
        dutyMs={minDutyMs}
        dutyPercentage={dutyToPercentage(minDutyMs)}
        onAdjust={onAdjustMin}
        onTest={onTestMin}
    />

    <CalibrationAdjuster
        label="Maximum Position (100%)"
        dutyMs={maxDutyMs}
        dutyPercentage={dutyToPercentage(maxDutyMs)}
        onAdjust={onAdjustMax}
        onTest={onTestMax}
    />

    <button onclick={onSwap} class="swap-button"> ↔️ Swap Min/Max (Reverse Direction) </button>

    <KlipperConfigPreview {minDutyMs} {maxDutyMs} />

    {#if currentPosition !== null && currentPosition !== undefined}
        <SensorGroup>
            <SensorReading label="Current Position" value={currentPosition.toFixed(1)} unit="%" />
        </SensorGroup>
    {/if}
</div>

<style>
    .calibration-mode {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .calibration-hint {
        margin: 0;
        padding: 0.75rem;
        background: var(--sensor-bg, #f8f8f8);
        border-left: 3px solid var(--button-bg, #007bff);
        border-radius: 4px;
        color: var(--text-muted, #666);
        font-size: 0.9rem;
    }

    .swap-button {
        width: 100%;
        padding: 0.75rem 1rem;
        background: var(--sensor-bg, #f8f8f8);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .swap-button:hover {
        background: var(--hover-bg, #f0f0f0);
        border-color: var(--button-bg, #007bff);
    }
</style>
