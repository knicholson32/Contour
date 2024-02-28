<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type $$Props = HTMLAttributes<HTMLTableSectionElement> & { noBorder?: boolean };

	let className: $$Props["class"] = undefined;
	export { className as class };
	export let noBorder = false;
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<thead class={cn((noBorder === true ? "[&_tr]:border-0 bg-card" : "[&_tr]:border-b bg-muted"), className)} {...$$restProps} on:click on:keydown>
	<slot />
</thead>
