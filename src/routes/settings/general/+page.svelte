<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
  import icons from '$lib/components/icons';
	import * as Settings from '$lib/components/routeSpecific/settings';
	import { timeZonesNames } from '@vvo/tzdb';

	interface Props {
		data: import('./$types').PageData;
		form: import('./$types').ActionData;
	}

	let { data, form }: Props = $props();

	// AeroAPI
	let aeroAPIList: Settings.List | null = $state(null);
	let aeroAPIUnsavedChanges = $state(false);
	let aeroAPI = $state(data.settingValues['general.aeroAPI']);

	// Email
	let emailList: Settings.List | null = $state(null);
	let emailUnsavedChanges = $state(false);
	let name = $state(data.settingValues['general.name']);
	let email = $state(data.settingValues['general.email']);

	// Localization
	let localizationList: Settings.List | null = $state(null);
	let localizationUnsavedChanges = $state(false);
	let timezone = $state(data.settingValues['general.timezone']);
	let prefers_utc = $state(data.settingValues['general.prefers_utc']);

	// Utilities
	beforeNavigate(({ cancel }) => {
		if (aeroAPIUnsavedChanges || emailUnsavedChanges || localizationUnsavedChanges) {
			if (!confirm( 'Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});
</script>

<!-- AeroAPI -->
<Settings.List bind:this={aeroAPIList} class="" {form} action="?/updateAeroAPI" bind:unsavedChanges={aeroAPIUnsavedChanges} >
	{#snippet title()}
		<span >FlightAware AeroAPI</span>
	{/snippet}
	{#snippet description()}
		<span >Configure AeroAPI details.</span>
	{/snippet}

	<Settings.Password name="general.aeroAPI" {form} title="Aero API Key" update={() => aeroAPIList?.update()} bind:value={aeroAPI} hoverTitle="Aero API Key">
	<a href="https://www.flightaware.com/aeroapi/portal/overview" target="_blank" title="Click to sign into Plex to generate a Plex Token for Unabridged to use." class="select-none w-full sm:w-auto flex justify-center items-center whitespace-nowrap px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 bg-white dark:bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 focus-visible:outline-grey-500">
		View AeroAPI Settings
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="ml-1 w-4 h-4">
			{@html icons.arrowTopRightOnSquare}
		</svg>
	</a>
	</Settings.Password>

	<!-- <Settings.Select {form} name="general.aeroAPI" title="Aero API Key" update={() => aeroAPIList?.update()} bind:value={aeroAPI} options={timeZonesNames.concat('UTC')} /> -->
</Settings.List>


<!-- Personalization -->
<Settings.List bind:this={emailList} class="" {form} action="?/updateEmail" bind:unsavedChanges={emailUnsavedChanges} >
	{#snippet title()}
		<span >Personalization</span>
	{/snippet}
	{#snippet description()}
		<span >Configure a name and email address for Contour to use.</span>
	{/snippet}

	<Settings.Input {form} name="general.name" title="Name" update={() => emailList?.update()} bind:value={name} />
	<Settings.Input {form} name="general.email" title="Email" update={() => emailList?.update()} bind:value={email} />

</Settings.List>


<!-- Localization -->
<Settings.List bind:this={localizationList} class="" {form} action="?/updateLocalization" bind:unsavedChanges={localizationUnsavedChanges} >
	{#snippet title()}
		<span >Localization</span>
	{/snippet}
	{#snippet description()}
		<span >Configure localization info for Contour.</span>
	{/snippet}

	<Settings.Select {form} name="general.timezone" title="Local Timezone" update={() => localizationList?.update()} bind:value={timezone} options={timeZonesNames.concat('UTC')} />

	<Settings.Switch name="general.prefers_utc" {form} title="Prefer UTC" update={() => localizationList?.update()} bind:value={prefers_utc} hoverTitle={'Whether or not to prefer UTC time over local time when a choice between them exists'} />

</Settings.List>

<div>
	<h2 class="text-base font-semibold leading-7 text-gray-900 dark:text-white">Version Information</h2>
	<p class="mt-1 text-sm leading-6 text-gray-500">
		Contour commit
		<a class="font-mono" href="https://github.com/knicholson32/Contour/commit/{data.version}" target="_blank">@{data.version.substring(0, 7)}</a >
	</p>
</div>
