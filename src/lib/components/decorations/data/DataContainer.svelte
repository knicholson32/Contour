<script lang="ts">
	let {
		children,
		useThree = false,
		...restProps
	} = $props();
</script>

{#if useThree}
	<div class="">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-1 gap-px bg-white/5 dark:bg-transparent sm:grid-cols-1 xl:grid-cols-3">
				{@render children?.()}
			</div>
		</div>
	</div>
{:else}
	<div class="">
		<div class="mx-auto max-w-7xl">
			<div class="grid grid-cols-2 gap-px bg-white/5 dark:bg-transparent sm:grid-cols-2 xl:grid-cols-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}