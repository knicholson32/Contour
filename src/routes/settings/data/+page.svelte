<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
  import { DataContainer, DataEntry } from '$lib/components/decorations/data';
	import * as Settings from '$lib/components/routeSpecific/settings';
  import { toISOStringTZ } from '$lib/helpers';
	import { timeZonesNames } from '@vvo/tzdb';
  import { intlFormatDistance } from 'date-fns';

	interface Props {
		data: import('./$types').PageData;
		form: import('./$types').ActionData;
	}

	let { data = $bindable(), form }: Props = $props();

	// Approach
	let approachList: Settings.List | null = $state(null);
	let approachUnsavedChanges = $state(false);

	let optionList: Settings.List | null = $state(null);
	let optionsUnsavedChanges = $state(false);
	// let timezone = data.settingValues['general.timezone'];
	let source: string = $state('unset');

	// Registration
	let regList: Settings.List | null = $state(null);
	let regUnsavedChanges = $state(false);

	// Navigation
	let navList: Settings.List | null = $state(null);
	let navUnsavedChanges = $state(false);
	let navSource: string = $state('unset');

	// Airports
	let airportList: Settings.List | null = $state(null);
	let airportUnsavedChanges = $state(false);

	// Utilities
	beforeNavigate(({ cancel }) => {
		if (approachUnsavedChanges || optionsUnsavedChanges || regUnsavedChanges || navUnsavedChanges) {
			if (!confirm('Are you sure you want to leave this page? You have unsaved changes that will be lost.')) {
				cancel();
			}
		}
	});

	let lastSync =
		$derived(data.settingValues['data.approaches.lastSync'] === -1
			? 'Never'
			: intlFormatDistance(new Date(data.settingValues['data.approaches.lastSync'] * 1000), new Date()));
	let lastSyncTime =
		$derived(data.settingValues['data.approaches.lastSync'] === -1 ? 'Never' : toISOStringTZ(data.settingValues['data.approaches.lastSync'] * 1000, data.settings['general.timezone']));


	let lastSyncReg =
		$derived(data.settingValues['data.aircraftReg.lastSync'] === -1
			? 'Never'
			: intlFormatDistance(new Date(data.settingValues['data.aircraftReg.lastSync'] * 1000), new Date()));
	let lastSyncTimeReg =
		$derived(data.settingValues['data.aircraftReg.lastSync'] === -1 ? 'Never' : toISOStringTZ(data.settingValues['data.aircraftReg.lastSync'] * 1000, data.settings['general.timezone']));

	let lastSyncNav =
		$derived(data.settingValues['data.navData.lastSync'] === -1
			? 'Never'
			: intlFormatDistance(new Date(data.settingValues['data.navData.lastSync'] * 1000), new Date()));
	let lastSyncTimeNav =
		$derived(data.settingValues['data.navData.lastSync'] === -1 ? 'Never' : toISOStringTZ(data.settingValues['data.navData.lastSync'] * 1000, data.settings['general.timezone']));

	let lastSyncAirport =
		$derived(data.settingValues['data.airportData.lastSync'] === -1
			? 'Never'
			: intlFormatDistance(new Date(data.settingValues['data.airportData.lastSync'] * 1000), new Date()));
	let lastSyncTimeAirport =
		$derived(data.settingValues['data.airportData.lastSync'] === -1 ? 'Never' : toISOStringTZ(data.settingValues['data.airportData.lastSync'] * 1000, data.settings['general.timezone']));


	let mxMode = $state(data.settingValues['entry.entryMXMode']);

</script>

<!-- Debug -->
<Settings.List bind:this={optionList} class=""  {form} action="?/updateOptions" bind:unsavedChanges={optionsUnsavedChanges} >
	{#snippet title()}
		<span >Data Entry</span>
	{/snippet}
	{#snippet description()}
		<span >Alter how data is entered into Contour.</span>
	{/snippet}

	<Settings.Switch name="entry.entryMXMode" {form} bind:value={mxMode} title="Enable data entry maintenance mode" update={() => optionList?.update()} hoverTitle={'Whether or not to allow FlightAware data to be deleted from leg and other maintenance features.'} />

	{#if mxMode}
		<Settings.Switch {form} name="options.clear" title="Clear Options ({data.numFlightOptions} in DB)" value={false} update={() => optionList?.update()}/>
		<Settings.Switch {form} name="useBlock.migrate" title="Migrate 'UseBlock' to DB" value={false} update={() => optionList?.update()}/>
	{/if}
</Settings.List>


<Settings.List bind:this={approachList} class="" {form} action="?/updateApproaches" bind:unsavedChanges={approachUnsavedChanges} >
	{#snippet title()}
		<span >Approach Database</span>
	{/snippet}
	{#snippet description()}
		<span >Update the Approach Database source.</span>
	{/snippet}

	<!-- <Settings.Switch name="system.debug.switch" {form} title="Enable Debug" update={debugUpdate} bind:value={debugEnabled} hoverTitle={'Whether or not to enable general debugging features and logs'} /> -->


	<Settings.Select {form} name="approach.option" title="Update To" update={() => approachList?.update()} bind:value={source}
		options={data.options}
	/>

	<DataContainer>
		<DataEntry title={'Approaches'} data={data.numApproaches.toFixed(0)}/>
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

<Settings.List bind:this={regList} class="" {form} action="?/updateRegLookup" bind:unsavedChanges={regUnsavedChanges} >
	{#snippet title()}
		<span >Aircraft Registration Database</span>
	{/snippet}
	{#snippet description()}
		<span >Update the Aircraft Registration Database source.</span>
	{/snippet}

	<Settings.Switch {form} name="update.switch" title="Update" value={false} update={() => regList?.update()}/>

	<DataContainer>
		<DataEntry title={'Aircraft'} data={data.numRegs.toFixed(0)}/>
		<DataEntry title={'Years'} data={data.years ?? 'Unknown'}/>
		<DataEntry title={'Data Source'}>
			<a target="_blank" href="https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry/releasable_aircraft_download">FAA Registry</a>
		</DataEntry>
		<DataEntry title={'Last Sync'}>
			<span title={lastSyncTimeReg}>{lastSyncReg}</span>
		</DataEntry>
	</DataContainer>

</Settings.List>

<Settings.List bind:this={navList} class="" {form} action="?/updateNavData" bind:unsavedChanges={navUnsavedChanges} >
	{#snippet title()}
		<span >FAA Navigation Database</span>
	{/snippet}
	{#snippet description()}
		<span >Update the FAA Navigation Database source.</span>
	{/snippet}

	<Settings.Select {form} name="nav.option" title="Update To" update={() => navList?.update()} bind:value={navSource}
		options={data.navDataOptions}
	/>

	<DataContainer>
		<DataEntry title={'Fixes'} data={data.numFixes.toFixed(0)}/>
		<DataEntry title={'Effective'} data={data.effectiveDateNav}/>
		<DataEntry title={'Data Source'}>
			{#if data.settingValues['data.navData.source'] === ''}
				None
			{:else}
				<a target="_blank" href="{data.settingValues['data.navData.source']}">FAA NASR</a>
			{/if}
		</DataEntry>
		<DataEntry title={'Last Sync'}>
			<span title={lastSyncTimeNav}>{lastSyncNav}</span>
		</DataEntry>
	</DataContainer>

</Settings.List>

<Settings.List bind:this={airportList} class="" {form} action="?/updateAirports" bind:unsavedChanges={airportUnsavedChanges} >
	{#snippet title()}
		<span >General Airport Database</span>
	{/snippet}
	{#snippet description()}
		<span >Update the General Airport data.</span>
	{/snippet}

	<Settings.Switch {form} name="update.switch" title="Update" value={false} update={() => airportList?.update()}/>

	<DataContainer useThree={true}>
		<DataEntry title={'Airports'} data={data.numRegs.toFixed(0)}/>
		<DataEntry title={'Data Source'}>
			<a target="_blank" href="https://github.com/ip2location/ip2location-iata-icao">IP2Location ICAO</a>
		</DataEntry>
		<DataEntry title={'Last Sync'}>
			<span title={lastSyncTimeAirport}>{lastSyncAirport}</span>
		</DataEntry>
	</DataContainer>

</Settings.List>