<script lang="ts">
	import { page } from '$app/stores';
	import { icons } from '$lib/components';

	const subMenuActive = 'bg-gray-50 text-indigo-600';
	const subMenuDefault = 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50';

	const subMenuIconActive = 'text-indigo-600';
	const subMenuIconDefault = 'text-gray-400 group-hover:text-indigo-600';
</script>

<div class="mx-auto max-w-7xl flex flex-col xl:gap-x-16 xl:px-8">
	<aside class="flex sm:justify-center overflow-x-scroll border-b border-gray-900/5 py-4">
		<nav class="flex-none px-4 sm:px-6 xl:px-0">
			<ul role="list" class="flex gap-x-3 gap-y-1 whitespace-nowrap">
				<li>
					<!-- Current: "bg-gray-50 text-indigo-600", Default: "text-gray-700 hover:text-indigo-600 hover:bg-gray-50" -->
					<a href="/settings/general" class="{$page.url.pathname === '/settings/general' ? subMenuActive : subMenuDefault} group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm leading-6 font-semibold" >
						<svg class="h-6 w-6 shrink-0 {$page.url.pathname === '/settings/general' ? subMenuIconActive : subMenuIconDefault}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
							{@html icons.adjustmentsHorizontal}
						</svg>
						General
					</a>
				</li>
				<li>
					<a href="/settings/system" class="{$page.url.pathname === '/settings/system' ? subMenuActive : subMenuDefault} group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm leading-6 font-semibold" >
						<svg class="h-6 w-6 shrink-0 {$page.url.pathname === '/settings/system' ? subMenuIconActive : subMenuIconDefault}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
							{@html icons.cube}
						</svg>
						System
					</a>
				</li>
			</ul>
		</nav>
	</aside>

	<main class="px-4 py-16 sm:px-6 xl:flex-auto xl:px-0 xl:py-8">
		<div class="mx-auto max-w-2xl space-y-16 sm:space-y-20 xl:mx-0 xl:max-w-none">
			<slot />
		</div>
	</main>
</div>