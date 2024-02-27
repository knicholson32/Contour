<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLTableAttributes } from "svelte/elements";

	type $$Props = HTMLTableAttributes & { selfScroll?: boolean };

	let className: $$Props["class"] = undefined;
	export { className as class };
	export let selfScroll = false;
</script>

<div class="w-full {selfScroll ? 'overflow-auto' : ''}">
	<table class={cn("w-full caption-bottom text-sm", className)} {...$$restProps}>
		<slot />
	</table>
</div>
