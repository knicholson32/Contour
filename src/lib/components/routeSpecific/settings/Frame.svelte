<script lang="ts">
	export let title: string;
	export let hoverTitle: string;
	export let error: string | null = null;
	export let success: string | null = null;
	export let link: { href: string; title: string; icon?: string } | null = null;
	export let titleLink: string | null = null;
	export let titleImg: string | null = null;
	export let badge: boolean | null = null;
	export let indent = false;
</script>

<div class="sm:mr-3 mt-0 mb-10 xs:mb-0">
	<div class="pt-6 flex flex-col xs:flex-row items-left xs:items-center">
		<dt class="xs:pr-6 inline-flex items-center gap-3 xs:block h-10 xs:h-auto font-medium text-gray-900 dark:text-gray-200 sm:w-64">
			<div class="flex gap-x-2 relative items-center {indent ? 'ml-5 font-mono' : ''}" title={hoverTitle} >
				{#if titleLink !== null}
					<a href={titleLink} class="flex gap-x-2 items-center">
						{#if titleImg !== null}
							<img src="{titleImg}/56" class="h-8 w-8 rounded-full" alt={title} />
						{/if}
						{title}
					</a>
				{:else}
					{#if titleImg !== null}
						<img src="{titleImg}/56" class="h-8 w-8 rounded-full" alt={title} />
					{/if}
					{title}
				{/if}
				{#if link !== null}
					<p class="text-xs leading-6 italic text-sky-500">
						<a class="inline-flex items-center" href={link.href} target="_blank">
							{link.title}
							{#if link.icon !== undefined}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="ml-1 w-4 h-4">
									{@html link.icon}
								</svg>
							{/if}
						</a>
					</p>
				{/if}
				{#if badge !== null && badge === true}
					<span class="absolute flex h-3 w-3 -right-4 sm:right-auto sm:-left-4" title="">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
					</span>
				{/if}
			</div>
			{#if error !== null}
				<p class="text-xs leading-6 text-red-500">{error}</p>
			{/if}
			{#if success !== null}
				<p class="text-xs leading-6 text-green-500">{success}</p>
			{/if}
		</dt>
		<dd class="flex flex-auto items-center justify-end relative">
				<slot />
		</dd>
	</div>
</div>
