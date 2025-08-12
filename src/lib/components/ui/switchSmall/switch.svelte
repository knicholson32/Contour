<script lang="ts">
	import { Switch as SwitchPrimitive, type WithoutChildrenOrChild } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		colorOnSwitched = true,
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & { colorOnSwitched?: boolean } = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	class={cn(
		"focus-visible:ring-ring focus-visible:ring-offset-background data-[state=unchecked]:bg-input peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className,
		colorOnSwitched === true ? 'data-[state=checked]:bg-primary' : 'data-[state=checked]:bg-input'
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		class={cn(
			"bg-background pointer-events-none block size-3 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0"
		)}
	/>
</SwitchPrimitive.Root>
