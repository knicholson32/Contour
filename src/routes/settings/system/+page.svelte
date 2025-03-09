<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import * as Settings from '$lib/components/routeSpecific/settings';
	import { timeZonesNames } from '@vvo/tzdb';

	interface Props {
		data: import('./$types').PageData;
		form: import('./$types').ActionData;
	}

	let { data, form }: Props = $props();

	// Debug
	let debugList: Settings.List | null = $state(null);
	let debugUnsavedChanges = $state(false);
	let debugEnabled = $state(data.settingValues['system.debug'] > 0);
	// let debugVerbose = data.settingValues['system.debug'] > 1;
	let debug = $state(`${data.settingValues['system.debug']}`);

	$effect(() => {
		if (debugEnabled === false) debug = '0';
		if (debugEnabled === true)
			debug = `${data.settingValues['system.debug'] > 0 ? data.settingValues['system.debug'] : 1}`;
	});

	// Localization
	let localizationList: Settings.List | null = $state(null);
	let localizationUnsavedChanges = $state(false);
	let timezone = $state(data.settingValues['general.timezone']);

	// Utilities
	beforeNavigate(({ cancel }) => {
		if (debugUnsavedChanges || localizationUnsavedChanges) {
			if (!confirm('Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});

	let buttonText = $state('Clear Unsaved Changes');
	const clearUnsaved = () => {
		localStorage.clear();
		buttonText = 'Cleared';
	}

</script>

<!-- Debug -->
<Settings.List bind:this={debugList} class="" {form} action="?/updateDebug" bind:unsavedChanges={debugUnsavedChanges} >
	{#snippet title()}
		<span >Debug</span>
	{/snippet}
	{#snippet description()}
		<span >General debugging features and logs.</span>
	{/snippet}

	<Settings.Switch name="system.debug.switch" {form} title="Enable Debug" update={() => debugList?.update()} bind:value={debugEnabled} hoverTitle={'Whether or not to enable general debugging features and logs'} />


	<Settings.Select {form} name="system.debug" title="Debug Verbose Level" update={() => debugList?.update()} bind:value={debug} disabled={debugEnabled === false}
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
	{#snippet title()}
		<span >Local Storage</span>
	{/snippet}
	{#snippet description()}
		<span >Manage local storage features.</span>
	{/snippet}

	<Settings.Button name="system.localStorage.clear" {form} title="Clear Unsaved Changes" buttonText={buttonText} hoverTitle={'Clear all unsaved changes stored on this local machine.'} onClick={clearUnsaved} />

</Settings.List>

<!-- Localization -->
<Settings.List bind:this={localizationList} class="" {form} action="?/updateLocalization" bind:unsavedChanges={localizationUnsavedChanges} >
	{#snippet title()}
		<span >Localization</span>
	{/snippet}
	{#snippet description()}
		<span >Configure localization info for Contour.</span>
	{/snippet}

	<Settings.Select {form} name="general.timezone" title="Local Timezone" update={() => localizationList?.update()} bind:value={timezone} options={timeZonesNames.concat('UTC')}/>
</Settings.List>