<script lang="ts">
  import type { ExportLeg } from "./utils.server";
  import { formatAirport, formatApproaches, toISODate } from "./utils.format.js";

  interface Props {
    legs: ExportLeg[];
    generatedAt: string;
    filterSummary: {
      start: string | null | undefined;
      end: string | null | undefined;
      aircraft: string;
      airports: string;
    };
    userInfo: {
      "general.name": string;
      "general.gravatar.hash": string;
    };
  }

  let props: Props = $props();

  let { legs, generatedAt, filterSummary, userInfo } = props;

</script>

<svelte:head>
  <style>
    :global(body) {
      margin: 0;
      font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
      color: #1f2933;
      background: #f8fafc;
    }
  </style>
</svelte:head>

<div class="document">
  <header class="document__header">
    <div>
      <h1>Contour Logbook Export</h1>
      <p class="document__name">{userInfo["general.name"]}</p>
      <p class="document__timestamp">Generated {generatedAt}</p>
    </div>
    <div class="document__filters">
      <div>
        <span class="label">Start:</span>
        <span>{filterSummary.start ?? "Not limited"}</span>
      </div>
      <div>
        <span class="label">End:</span>
        <span>{filterSummary.end ?? "Not limited"}</span>
      </div>
      <div>
        <span class="label">Aircraft:</span>
        <span>{filterSummary.aircraft}</span>
      </div>
      <div>
        <span class="label">Airports:</span>
        <span>{filterSummary.airports}</span>
      </div>
      <!-- <img style="height: 0.5in; width: 0.5in; clip-path: circle();" src="https://www.gravatar.com/avatar/{userInfo["general.gravatar.hash"]}?s=300&d=identicon" alt=""> -->
    </div>
  </header>

  <!-- <div style="page-break-before:always">&nbsp;</div>  -->

  <main>
    <table class="logbook-table" style="">
      <thead>
        <tr style="white-space: nowrap">
          <th style="width: 8%">Date</th>
          <th style="width: 6.25%">Aircraft</th>
          <th style="width: 5%">From</th>
          <th style="width: 5%">To</th>
          <th style="width: 4%">Total</th>
          <th style="width: 4%">PIC</th>
          <th style="width: 4%">SIC</th>
          <th style="width: 4%">Night</th>
          <th style="width: 4%">XC</th>
          <th style="width: 4%">Inst</th>
          <th style="width: 5%">Sim Inst</th>
          <th style="width: 3%">Ldg</th>
          <th style="width: 3%">Hld</th>
          <th style="width: 19%">Approaches</th>
          <th style="width: 21.75%">Notes</th>
        </tr>
      </thead>
      <tbody>
        {#if legs.length === 0}
          <tr>
            <td colspan="17" class="empty">No log entries found for the selected filters.</td>
          </tr>
        {:else}
          {#each legs as leg}
            <tr>
              <td>{toISODate(leg.startTime_utc)}</td>
              <td>
                <div class="stacked">
                  <span class="primary">{leg.aircraft?.registration ?? ""}</span>
                  <!-- {#if leg.aircraft?.type}
                    <span class="secondary">
                      {leg.aircraft.type.typeCode}
                      {#if leg.aircraft?.simulator}
                        (Sim)
                      {/if}
                    </span>
                  {/if} -->
                </div>
              </td>
              <td>{formatAirport(leg.originAirport)}</td>
              {#if leg.diversionAirport === null}
                <td>{formatAirport(leg.destinationAirport)}</td>
              {:else}
                <td>
                  <span style="  text-decoration: line-through;">{formatAirport(leg.destinationAirport)}</span>
                  <span>{formatAirport(leg.diversionAirport)}</span>
                </td>
              {/if}
              <td>{leg.totalTime.toFixed(1)}</td>
              <td>{leg.pic === 0 ? '' : leg.pic.toFixed(1)}</td>
              <td>{leg.sic === 0 ? '' : leg.sic.toFixed(1)}</td>
              <td>{leg.night === 0 ? '' : leg.night.toFixed(1)}</td>
              <td>{leg.xc === 0 ? '' : leg.xc.toFixed(1)}</td>
              <td>{leg.actualInstrument === 0 ? '' : leg.actualInstrument.toFixed(1)}</td>
              <td>{leg.simulatedInstrument === 0 ? '' : leg.simulatedInstrument.toFixed(1)}</td>
              <td>{(leg.dayLandings + leg.nightLandings) === 0 ? '' : (leg.dayLandings + leg.nightLandings).toFixed(0)}</td>
              <td>{leg.holds === 0 ? '' : leg.holds.toFixed(0)}</td>
              <td style="font-size: 0.5rem;">{formatApproaches(leg.approaches)}</td>
              <td class="notes-cell">
                {#if leg.notes && leg.notes.trim().length > 0}
                  {leg.notes}
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </main>

  <footer class="document__footer">
    <p>Exported with Contour</p>
  </footer>
</div>


<style>
  @import '$lib/components/routeSpecific/pdf/ExportDocument.css';
</style>