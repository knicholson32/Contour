<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
  import { DataContainer, DataEntry } from '$lib/components/decorations/data';
	import * as Settings from '$lib/components/routeSpecific/settings';
  import { toISOStringTZ } from '$lib/helpers';
	import { timeZonesNames } from '@vvo/tzdb';
  import { intlFormatDistance } from 'date-fns';

	export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

	// Approach
	let approachUpdate: () => {};
	let approachUnsavedChanges = false;

	let optionUpdate: () => {};
	let optionsUnsavedChanges = false;
	// let timezone = data.settingValues['general.timezone'];
	let source: string = 'unset';

	// Utilities
	beforeNavigate(({ cancel }) => {
		if (approachUnsavedChanges || optionsUnsavedChanges) {
			if (!confirm('Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});

	const lastSync =
		data.settingValues['data.approaches.lastSync'] === -1
			? 'Never'
			: intlFormatDistance(new Date(data.settingValues['data.approaches.lastSync'] * 1000), new Date());
	const lastSyncTime =
		data.settingValues['data.approaches.lastSync'] === -1 ? 'Never' : toISOStringTZ(data.settingValues['data.approaches.lastSync'] * 1000, data.settings['general.timezone']);

</script>

<!-- Debug -->
<Settings.List class="" {form} action="?/updateOptions" bind:unsavedChanges={optionsUnsavedChanges} bind:update={optionUpdate} >
	<span slot="title">Data Entry</span>
	<span slot="description">Alter how data is entered into Contour.</span>

	<Settings.Switch name="entry.entryMXMode" {form} bind:value={data.settingValues['entry.entryMXMode']} title="Enable data entry maintenance mode" update={optionUpdate} hoverTitle={'Whether or not to allow FlightAware data to be deleted from leg and other maintenance features.'} />
</Settings.List>


<Settings.List class="" {form} action="?/updateApproaches" bind:unsavedChanges={approachUnsavedChanges} bind:update={approachUpdate} >
	<span slot="title">Approach Database</span>
	<span slot="description">Update the Approach Database source.</span>

	<!-- <Settings.Switch name="system.debug.switch" {form} title="Enable Debug" update={debugUpdate} bind:value={debugEnabled} hoverTitle={'Whether or not to enable general debugging features and logs'} /> -->


	<Settings.Select {form} name="approach.option" title="Update To" update={approachUpdate} bind:value={source}
		options={data.options}
	/>

	<DataContainer>
		<DataEntry title={'Approaches'} data={data.numApproaches}/>
		<DataEntry title={'Effective'} data={data.effectiveDate}/>
		<DataEntry title={'Data Source'}>
			{#if data.settingValues['data.approaches.source'] === ''}
				None
			{:else}
				<a target="_blank" href="https://aeronav.faa.gov/Upload_313-d/cifp/{data.settingValues['data.approaches.source']}">{data.settingValues['data.approaches.source']}</a>
			{/if}
		</DataEntry>
		<DataEntry title={'Last Sync'}>
				<span title={lastSyncTime}>{lastSync}</span>
			</DataEntry>
	</DataContainer>

</Settings.List>