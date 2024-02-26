<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import * as Settings from '$lib/components/routeSpecific/settings';
	import { timeZonesNames } from '@vvo/tzdb';

	export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

	// Debug
	let debugUpdate: () => {};
	let debugUnsavedChanges = false;
	let debugEnabled = data.settingValues['system.debug'] > 0;
	// let debugVerbose = data.settingValues['system.debug'] > 1;
	let debug = `${data.settingValues['system.debug']}`;

	$: {
		if (debugEnabled === false) debug = '0';
		if (debugEnabled === true)
			debug = `${data.settingValues['system.debug'] > 0 ? data.settingValues['system.debug'] : 1}`;
	}

	// Localization
	let localizationUpdate: () => {};
	let localizationUnsavedChanges = false;
	let timezone = data.settingValues['general.timezone'];

	// Utilities
	beforeNavigate(({ cancel }) => {
		if (debugUnsavedChanges || localizationUnsavedChanges) {
			if (!confirm('Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});

	let buttonText = 'Clear Unsaved Changes';
	const clearUnsaved = () => {
		localStorage.clear();
		buttonText = 'Cleared';
	}

</script>

<!-- Debug -->
<Settings.List class="" {form} action="?/updateDebug" bind:unsavedChanges={debugUnsavedChanges} bind:update={debugUpdate} >
	<span slot="title">Debug</span>
	<span slot="description">General debugging features and logs.</span>

	<Settings.Switch name="system.debug.switch" {form} title="Enable Debug" update={debugUpdate} bind:value={debugEnabled} hoverTitle={'Whether or not to enable general debugging features and logs'} />


	<Settings.Select {form} name="system.debug" title="Debug Verbose Level" update={debugUpdate} bind:value={debug} disabled={debugEnabled === false}
		options={[
			{ title: 'None', value: '0', unset: true },
			{ title: 'Debug', value: '1' },
			{ title: 'Verbose', value: '2' },
			{ title: 'Very Verbose', value: '3' }
	]}
	/>
</Settings.List>

<!-- Local Storage -->
<Settings.List class="" {form} action="?/localStorage"  >
	<span slot="title">Local Storage</span>
	<span slot="description">Manage local storage features.</span>

	<Settings.Button name="system.localStorage.clear" {form} title="Clear Unsaved Changes" buttonText={buttonText} hoverTitle={'Clear all unsaved changes stored on this local machine.'} onClick={clearUnsaved} />

</Settings.List>

<!-- Localization -->
<Settings.List class="" {form} action="?/updateLocalization" bind:unsavedChanges={localizationUnsavedChanges} bind:update={localizationUpdate} >
	<span slot="title">Localization</span>
	<span slot="description">Configure localization info for Unabridged.</span>

	<Settings.Select {form} name="general.timezone" title="Local Timezone" update={localizationUpdate} bind:value={timezone} options={timeZonesNames.concat('UTC')}/>
</Settings.List>