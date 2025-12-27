<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Apply theme class to body
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.toggle('dark', themeStore.isDark);
		}
	});
</script>

{@render children()}
