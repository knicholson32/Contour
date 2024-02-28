<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type $$Props = HTMLAttributes<HTMLDivElement> & { numberOfMonths: number };

	let className: $$Props["class"] = undefined;
	export { className as class };
	export let numberOfMonths: $$Props['numberOfMonths'];
</script>

<div
	class={cn("mt-4 flex  space-y-4 sm:space-x-4 sm:space-y-0", numberOfMonths > 1 ? 'flex-col sm:flex-row' : 'flex-row', className)}
	{...$$restProps}
>
	<slot />
</div>
