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

    // Only lock on mobile/tablet (<=1024px)
    let isLocked = $state(false);

    $effect(() => {
        const checkScreenSize = () => {
            isLocked = window.innerWidth <= 1024;
        };

        // Check initial size
        checkScreenSize();

        // Listen for resize
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    });

    function toggleLock() {
        isLocked = !isLocked;
    }
</script>

<div class="slider-control-wrapper">
    <label for="slider-{label}" class="control-label">{label}</label>
    <div class="slider-container">
        <button
            onclick={toggleLock}
            class="lock-button"
            aria-label={isLocked ? 'Unlock slider' : 'Lock slider'}
        >
            {#if isLocked}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path
                        d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
                    />
                </svg>
            {:else}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path
                        d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2z"
                    />
                </svg>
            {/if}
        </button>
        <input
            type="range"
            id="slider-{label}"
            {min}
            {max}
            {step}
            bind:value
            {onchange}
            disabled={isLocked}
            class="slider"
            class:locked={isLocked}
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

    .lock-button {
        display: none;
        padding: 0.375rem;
        background: var(--sensor-bg, #f8f8f8);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .lock-button:hover {
        background: var(--hover-bg, #f0f0f0);
        border-color: var(--button-bg, #007bff);
    }

    .lock-button svg {
        display: block;
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

    .slider.locked {
        opacity: 0.5;
        cursor: not-allowed;
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

    @media (max-width: 1024px) {
        .lock-button {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .slider:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
        background: var(--text-muted, #888);
    }

    .slider:disabled::-moz-range-thumb {
        cursor: not-allowed;
        background: var(--text-muted, #888);
    }
</style>
