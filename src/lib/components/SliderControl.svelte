<script lang="ts">
    let {
        label,
        value = $bindable(),
        min = 0,
        max = 100,
        step = 1,
        unit = '%',
        decimals = 0,
        onchange
    }: {
        label: string;
        value: number;
        min?: number;
        max?: number;
        step?: number;
        unit?: string;
        decimals?: number;
        onchange?: () => void;
    } = $props();

    const displayValue = $derived(value.toFixed(decimals) + unit);
</script>

<div class="slider-control-wrapper">
    <label for="slider-{label}" class="control-label">{label}</label>
    <div class="slider-container">
        <input
            type="range"
            id="slider-{label}"
            {min}
            {max}
            {step}
            bind:value
            {onchange}
            class="slider"
        />
        <span class="slider-value">{displayValue}</span>
    </div>
</div>

<style>
    .slider-control-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .control-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-color, #333);
    }

    .slider-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .slider {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: var(--sensor-bg, #f8f8f8);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        transition: background 0.2s;
    }

    .slider::-webkit-slider-thumb:hover {
        background: var(--button-hover, #0056b3);
    }

    .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--button-bg, #007bff);
        cursor: pointer;
        border: none;
        transition: background 0.2s;
    }

    .slider::-moz-range-thumb:hover {
        background: var(--button-hover, #0056b3);
    }

    .slider-value {
        min-width: 50px;
        font-weight: 600;
        color: var(--text-color, #333);
        text-align: right;
    }
</style>
