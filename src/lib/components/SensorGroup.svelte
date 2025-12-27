<script lang="ts">
    import type { Snippet } from 'svelte';

    let { label, children }: { label?: string; children: Snippet } = $props();
</script>

<div class="sensor-group">
    {#if label}
        <h4>{label}</h4>
    {/if}
    <div class="sensor-grid">
        {@render children()}
    </div>
</div>

<style>
    .sensor-group {
        margin-bottom: 1rem;
    }

    .sensor-group h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: var(--text-muted, #666);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .sensor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }
</style>
