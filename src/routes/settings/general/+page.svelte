<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
  import icons from '$lib/components/icons';
	import * as Settings from '$lib/components/routeSpecific/settings';
	import { timeZonesNames } from '@vvo/tzdb';

	export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

	// AeroAPI
	let aeroAPIUpdate: () => {};
	let aeroAPIUnsavedChanges = false;
	let aeroAPI = data.settingValues['general.aeroAPI'];

	// Email
	let emailUpdate: () => {};
	let emailUnsavedChanges = false;
	let name = data.settingValues['general.name'];
	let email = data.settingValues['general.email'];

	// Localization
	let localizationUpdate: () => {};
	let localizationUnsavedChanges = false;
	let timezone = data.settingValues['general.timezone'];

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
<Settings.List class="" {form} action="?/updateAeroAPI" bind:unsavedChanges={aeroAPIUnsavedChanges} bind:update={aeroAPIUpdate} >
	<span slot="title">FlightAware AeroAPI</span>
	<span slot="description">Configure AeroAPI details.</span>

	<Settings.Password name="general.aeroAPI" {form} title="Aero API Key" update={aeroAPIUpdate} bind:value={aeroAPI} hoverTitle="Aero API Key">
	<a href="https://www.flightaware.com/aeroapi/portal/overview" target="_blank" title="Click to sign into Plex to generate a Plex Token for Unabridged to use." class="select-none w-full sm:w-auto flex justify-center items-center whitespace-nowrap px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 focus-visible:outline-grey-500">
		View AeroAPI Settings
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="ml-1 w-4 h-4">
			{@html icons.arrowTopRightOnSquare}
		</svg>
	</a>
	</Settings.Password>

	<!-- <Settings.Select {form} name="general.aeroAPI" title="Aero API Key" update={aeroAPIUpdate} bind:value={aeroAPI} options={timeZonesNames.concat('UTC')} /> -->
</Settings.List>


<!-- Personalization -->
<Settings.List class="" {form} action="?/updateEmail" bind:unsavedChanges={emailUnsavedChanges} bind:update={emailUpdate} >
	<span slot="title">Personalization</span>
	<span slot="description">Configure a name and email address for Contour to use.</span>

	<Settings.Input {form} name="general.name" title="Name" update={emailUpdate} bind:value={name} />
	<Settings.Input {form} name="general.email" title="Email" update={emailUpdate} bind:value={email} />

</Settings.List>


<!-- Localization -->
<Settings.List class="" {form} action="?/updateLocalization" bind:unsavedChanges={localizationUnsavedChanges} bind:update={localizationUpdate} >
	<span slot="title">Localization</span>
	<span slot="description">Configure localization info for Contour.</span>

	<Settings.Select {form} name="general.timezone" title="Local Timezone" update={localizationUpdate} bind:value={timezone} options={timeZonesNames.concat('UTC')} />
</Settings.List>

<div>
	<h2 class="text-base font-semibold leading-7 text-gray-900">Version Information</h2>
	<p class="mt-1 text-sm leading-6 text-gray-500">
		Contour commit
		<a class="font-mono" href="https://github.com/knicholson32/unabridged/commit/{data.version}" target="_blank">@{data.version.substring(0, 7)}</a >
	</p>
</div>
