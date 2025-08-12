<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import * as Map from '$lib/components/map';
  import { page } from '$app/stores';
  import * as Card from "$lib/components/ui/card";
  import { afterNavigate, beforeNavigate, goto} from '$app/navigation';
  import type * as Types from '@prisma/client';
  import { API, DB, type GXTrack, type KML } from '$lib/types';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import { dateToDateStringForm, dateToDateStringFormMonthDayYear, dateToDateStringFormSimple, dateToTimeStringZulu, getDistanceFromLatLonInKm, pad, timeStrAndTimeZoneToUTC } from '$lib/helpers';
  import { v4 as uuidv4 } from 'uuid';
  import { browser } from '$app/environment';
  import { AlertCircle, Briefcase, CalendarDays, ChevronRight, Dot, FileIcon, Gauge, Link, Menu, Plus, Route, RouteOff, Table2, Timer, Waypoints } from 'lucide-svelte';
  import { VisXYContainer, VisLine, VisScatter, VisAxis, VisCrosshair, VisTooltip, VisArea, VisBulletLegend } from "@unovis/svelte";
	import { color, scatterPointColors, scatterPointStrokeColors } from "$lib/components/ui/helpers";
  import Tooltip from '$lib/components/routeSpecific/leg/Tooltip.svelte';
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import type { ChangeEventHandler } from 'svelte/elements';
  import { XMLParser } from 'fast-xml-parser';

  interface Props {
    form: import('./$types').ActionData;
    data: import('./$types').PageData;
  }

  let { form: formData, data }: Props = $props();

  let submitting = $state(false);
  let deleting = $state(false);

  let startAirportTZ: string | null = data.startTimezone?.name ?? null;
  let endAirportTZ: string | null = data.endTimezone?.name ?? null;
  let divertAirportTZ: string | null = data.endTimezone?.name ?? null;

  let endApt: string | null;
  let divertApt: string | null;

  let outTime: string = '';
  let inTime: string = '';

  // Default to UTC
  let outTZ: string | null = 'UTC';
  let inTZ: string | null = 'UTC';

  let outTimeUTC = $derived(outTZ === null ? null : timeStrAndTimeZoneToUTC(outTime, outTZ));
  let inTimeUTC = $derived(inTZ === null ? null : timeStrAndTimeZoneToUTC(inTime, inTZ));

  let mapKey = $state(uuidv4());
  const resetMap = () => {
    mapKey = uuidv4();
    // latLong = null;
  }

  $effect(() => {
    formData;
    data;
    resetMap();
  });

  let menuElements: { [key: string]: HTMLAnchorElement } = {};

  beforeNavigate(() => {
    menuElements = {};
  });


  let positions: Types.Position[] = $state([]);

  let scrollToDiv: HTMLAnchorElement | null = null;

  // afterNavigate(() => {
  //   if (data.leg === null) scrollToDiv = null;
  //   else {
  //     if (data.leg.id in menuElements) scrollToDiv = menuElements[data.leg.id];
  //     else scrollToDiv = null;
  //   }
  //   setTimeout(() => {
  //     resetMap()
  //   }, 1);
  // });

  const ref = $page.url.searchParams.get('ref');

  const tickFormat = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return pad(date.getUTCHours(), 2) + ':' + pad(date.getUTCMinutes(), 2);
  }

  let speedScaler = 1;

  const x = (d: Types.Position) => d.timestamp;
  const yAltitude = (d: Types.Position) => {
    if (d.updateType === DB.UpdateType.PROJECTED || d.groundspeed === 0) return undefined;
    return d.altitude * 100;
  }
  const ySpeed = (d: Types.Position) => {
    if (d.updateType === DB.UpdateType.PROJECTED || d.groundspeed === 0) return undefined;
    return d.groundspeed * speedScaler;
  }
  const crosshairColor = (d: Types.Position, i: number) => [color()(),color({ secondary: true })()][i]

  let tooltip: HTMLElement | undefined = $state();
  let position: Types.Position | undefined = $state();
  let latLong: [number, number] | null = $state(null);
  const template = (d: Types.Position) => {
    position = d;
    latLong = [d.latitude, d.longitude];
    return tooltip;
  }

  let tooltipContainer: HTMLElement | undefined = $state(undefined);
  if (browser) tooltipContainer = document.body;

  let files: FileList | undefined = $state();
  let size = $state(0);

  const processKML = async (file: File) =>  {
    const parser = new XMLParser({ ignoreAttributes: false });
    let jObj = parser.parse(await file.text()) as KML;

    let gxTrack: GXTrack | null = null;
    let altitude: number[] | null = null;
    let speed: number[] | null = null;
    let course: number[] | null = null;

    try {
      // Assume that it is the format that ForeFlight uses
      for (const placemark of jObj.kml.Document.Placemark) {
        if (placemark.name === '' && (placemark as GXTrack)['gx:Track'] !== undefined) {
          gxTrack = placemark as GXTrack;
          break;
        }
      }

      for (const data of jObj.kml.Document.ExtendedData.SchemaData['gx:SimpleArrayData']) {
        if (data['@_name'] === 'course') course = data['gx:value'];
        else if (data['@_name'] === 'speed_kts') speed = data['gx:value'];
        else if (data['@_name'] === 'altitude') altitude = data['gx:value'];
      }
    } catch (e) {
      // It wasn't the format that ForeFlight uses. Try to parse it as a FlightAware KML
      try {
        // Assume that it is the format that ForeFlight uses
        for (const placemark of jObj.kml.Document.Placemark) {
          if ((placemark as GXTrack)['gx:Track'] !== undefined) {
            gxTrack = placemark as GXTrack;
            break;
          }
        }

        if (gxTrack !== null && gxTrack['gx:Track']['gx:coord'].length > 1) {
          // Extract timestamps
          const timestamps = gxTrack['gx:Track'].when.map((t: string) => Math.floor(new Date(t).getTime() / 1000));
          // Calculate the speed and altitude from the coordinates
          let pastPosition: [number, number] = [gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[0], gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[1]];

          altitude = [gxTrack['gx:Track']['gx:coord'][0].split(' ').flatMap((v) => parseFloat(v))[3] * 3.28084];
          speed = [];
          course = [];
          for (let i = 1; i < gxTrack['gx:Track']['gx:coord'].length; i++) {
            const coord = gxTrack['gx:Track']['gx:coord'][i].split(' ').flatMap((v) => parseFloat(v));
            const timeDiff = timestamps[i] - timestamps[i - 1];
            const pos = [coord[0], coord[1]];
            const distanceKM = getDistanceFromLatLonInKm(pastPosition[1], pastPosition[0], pos[1], pos[0]);
            speed.push(((distanceKM / timeDiff) * 3600) * 0.539957); // Convert to knots
            if (speed[i - 1] === 0) speed[i - 1] = speed[i];
            if (speed[i] === 0) speed[i] = speed[i - 1];
            course.push(Math.atan2(pos[1] - pastPosition[1], pos[0] - pastPosition[0]) * (180 / Math.PI));
            altitude.push(coord[2] * 3.28084);
            pastPosition = [coord[0], coord[1]];
          }
        }
      } catch (e) {
        // Unknown format
      }
    }

    if (gxTrack === null || altitude === null || speed === null || course === null || altitude.length === 0 || speed.length === 0 || course.length === 0) {
      // TODO: Throw an error
      return;
    }

    if (gxTrack['gx:Track']['gx:coord'].length !== gxTrack['gx:Track'].when.length) {
      // TODO: Throw an error
      return;
    }


    positions = [];
    let lastTime = -1;
    for (let i = 0; i < gxTrack['gx:Track']['gx:coord'].length; i++) {


      const coord = gxTrack['gx:Track']['gx:coord'][i].split(' ').flatMap((v) => parseFloat(v));
      const time = Math.floor(new Date(gxTrack['gx:Track']['when'][i]).getTime() / 1000);
      if (lastTime !== -1 && time - lastTime > 120) break;
      lastTime = time;
      if (speed[i] === 0) continue;

      positions.push({
        legId: data.leg.id,
        altitude: (altitude[i] / 100),
        altitudeChange: '',
        groundspeed: speed[i],
        heading: course[i],
        latitude: coord[1],
        longitude: coord[0],
        timestamp: time,
        updateType: 'KML'
      });
    }

    speedScaler = 1;
    let maxSpeed = 0;
    let maxAlt = 0;

    for (const p of positions) {
      if (p.altitude * 100 > maxAlt) maxAlt = p.altitude * 100;
      if (p.groundspeed > maxSpeed) maxSpeed = p.groundspeed;
    }
    speedScaler = maxAlt / maxSpeed * 1;
  }

  const processCSV = async (file: File) => {

  }

  const fileUpdate: ChangeEventHandler<HTMLInputElement> = async (event: Event) => {
    console.log(event);
    size = 0;
    if (files === undefined) return;
    if (files.length !== 0) {
      const file = files[0];
      if (file !== null) {
        size = file.size / 1000000;
        if (file.type === 'application/vnd.google-earth.kml+xml') await processKML(file);
        else if (file.type === 'text/csv') await processCSV(file);
      }
    }
    mapKey = uuidv4();
  }


</script>

<div class="hidden">
  <Tooltip bind:el={tooltip} bind:position />
</div>

<OneColumn>
  
  <div class="shrink relative">
    {#key mapKey}
      <Map.Leg class="h-[calc(100vh-4rem)]! z-50" positions={positions} target={latLong} fixes={data.leg.fixes} airports={data.airportList} />
    {/key}

    <form id="form-delete" action="?/delete" method="post" use:enhance={({ cancel }) => {
      const answer = confirm('Are you sure you want to delete this position data? This action cannot be undone.');
      if (!answer) cancel();
      else {
        deleting = true;
        return async ({ update }) => {
          await update({ invalidateAll: true });
          deleting = false;
        };
      }
    }}>
    </form>

    <form action="?/update" method="post" enctype="multipart/form-data" class="col-start-9 col-span-4" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
      };
    }}>

      <div class="absolute z-50 bottom-[0rem] left-0 right-0 grid grid-cols-12 gap-4 p-4">
        <div class="col-start-9 col-span-4 inline-flex -mt-[2px] w-full flex-row gap-3 justify-end">
          {#if data.leg !== null}
            <div class="grow md:w-48 md:grow-0 flex items-start">
              <Submit remoteForm="form-delete" class="w-full" failed={formData?.ok === false && formData.action === '?/delete'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
            </div>
          {/if}
          <Submit class="grow w-full md:w-48 md:grow-0" failed={formData?.ok === false && (formData.action === '?/default' || formData?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Upload" actionTextInProgress="Uploading" />
        </div>

        <Card.Root class="col-span-8">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-semibold">Speed and Altitude</Card.Title>
            <Table2 class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content class="p-4 pt-0">
            <div onmouseleave={() => latLong=[0, 0]} role="presentation">
              {#key positions}
                <VisXYContainer data={positions} height="80" padding={{left: 5, right: 5, top: 5, bottom: 5}}>
                  <VisAxis gridLine={false} type="x" tickValues={data.tickValues} minMaxTicksOnly={false} {tickFormat} />
                  <VisCrosshair {template} color={crosshairColor} />
                  <VisTooltip verticalPlacement={'top'} horizontalPlacement={'right'} verticalShift={25} container={tooltipContainer} /> 
                  <VisLine {x} y={yAltitude} color={color({secondary: false})} />
                  <VisLine {x} y={ySpeed} color={color({secondary: true})} />
                  <VisBulletLegend items={[
                    { name: 'Altitude', color: color()() },
                    { name: 'Speed', color: color({ secondary: true })() },
                  ]} />
                </VisXYContainer>
              {/key}
            </div>
          </Card.Content>
        </Card.Root>
        <Card.Root class="col-span-4">
          <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Card.Title class="text-sm font-semibold">File Upload</Card.Title>
            <FileIcon class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content class="p-4 pt-0">
            <!-- <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white" for="file_input">Upload file</label> -->
            <input bind:files type="file" name="file.upload" id="file-input" accept=".kml" onchange={fileUpdate} class="block w-full border border-gray-200 shadow-xs rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400
              cursor-pointer
              file:cursor-pointer
            file:bg-gray-50 file:border-0
              file:me-4
              file:py-3 file:px-4
            dark:file:bg-neutral-700 dark:file:text-neutral-400">
            <div class="inline-flex w-full mt-1 text-sm text-gray-500 dark:text-gray-300">
              <p>{size.toFixed(1)}MB</p>
              <div class="grow"></div>
              <p>KML (max 10MB)</p>
            </div>
            {#if formData?.ok === false}
              <p class="text-xxs text-red-500">{formData?.message}</p>
            {/if}
          </Card.Content>
        </Card.Root>


      </div>

    </form>

  </div>

</OneColumn>
