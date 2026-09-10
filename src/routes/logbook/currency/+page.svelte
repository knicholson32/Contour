<script lang="ts">
  import OneColumn from "$lib/components/scrollFrames/OneColumn.svelte";
  import { dateToDateStringFormMonthDayYear } from "$lib/helpers";
  import { AlertTriangle, BookCheck, Clock3 } from "lucide-svelte";

  interface Props {
    data: import("./$types").PageData;
  }

  type PageData = Props["data"];
  type TolReport = PageData["currency"]["asel"]["general"];
  type IFRReport = PageData["currency"]["ifr"];
  type CurrencyStatus = "current" | "at-risk" | "expired";

  type BaseSummary = {
    id: string;
    title: string;
    subtitle?: string;
    group: string;
    status: CurrencyStatus;
    statusLabel: string;
    currencyExpiry: number | null;
    daysRemaining: number | null;
    expiryLabel: string;
    requirementLine: string;
    actionLine: string;
    windowDays: number;
  };

  type TolSnapshot = {
    status: CurrencyStatus;
    statusLabel: string;
    currencyExpiry: number | null;
    daysRemaining: number | null;
    expiryLabel: string;
    requirementLine: string;
    actionLine: string;
  };

  type TolSummary = BaseSummary & {
    variant: string;
    reportType: "tol";
    report: TolReport;
  };

  type IFRSummary = BaseSummary & {
    variant: string;
    reportType: "ifr";
    report: IFRReport;
  };

  type CombinedSummary = BaseSummary & {
    variant: string;
    reportType: "combined";
    report: { general: TolReport; night: TolReport };
    combinedKind: "class" | "type";
    day: TolSnapshot;
    night: TolSnapshot;
  };

  type CurrencySummary = TolSummary | IFRSummary | CombinedSummary;

  let { data }: Props = $props();

  const DAY_SECONDS = 60 * 60 * 24;
  const TOL_WINDOW_DAYS = 90;
  const IFR_WINDOW_DAYS = 180;

  const statusLabels: Record<CurrencyStatus, string> = {
    current: "Current",
    "at-risk": "Expiring soon",
    expired: "Not current",
  };

  const statusBadgeClass: Record<CurrencyStatus, string> = {
    current:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30",
    "at-risk":
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40",
    expired:
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/40",
  };

  const statusTextClass: Record<CurrencyStatus, string> = {
    current: "text-emerald-600 dark:text-emerald-300",
    "at-risk": "text-amber-600 dark:text-amber-300",
    expired: "text-rose-600 dark:text-rose-300",
  };

  const statusPriority: Record<CurrencyStatus, number> = {
    current: 0,
    "at-risk": 1,
    expired: 2,
  };

  const pluralize = (count: number, singular: string, plural?: string) => {
    const label = count === 1 ? singular : (plural ?? `${singular}s`);
    return `${count} ${label}`;
  };

  const computeDaysRemaining = (expiry: number | null) => {
    if (expiry === null) return null;
    const diff = expiry - data.nowSeconds;
    const days = Math.ceil(diff / DAY_SECONDS);
    return days < 0 ? 0 : days;
  };

  const makeExpiryLabel = (
    status: CurrencyStatus,
    expiry: number | null,
    daysRemaining: number | null,
  ) => {
    if (status === "expired") {
      if (expiry) {
        return `Expired ${dateToDateStringFormMonthDayYear(expiry)}`;
      }
      return "Expired";
    }

    if (expiry && daysRemaining !== null) {
      if (daysRemaining === 0) {
        return "Expires today";
      }
      return `Expires in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`;
    }

    return "Currency active";
  };

  const deriveTolSnapshot = (
    report: TolReport,
    variant: string,
  ): TolSnapshot => {
    const expiry = report.currencyExpiry > 0 ? report.currencyExpiry : null;
    const daysRemaining = computeDaysRemaining(expiry);
    const status: CurrencyStatus = !report.isCurrent
      ? "expired"
      : daysRemaining !== null && daysRemaining <= 30
        ? "at-risk"
        : "current";

    const outstanding: string[] = [];
    if (report.takeoffs < 3)
      outstanding.push(pluralize(3 - report.takeoffs, "takeoff"));
    if (report.landings < 3)
      outstanding.push(pluralize(3 - report.landings, "landing"));

    return {
      status,
      statusLabel: statusLabels[status],
      currencyExpiry: expiry,
      daysRemaining,
      expiryLabel: makeExpiryLabel(status, expiry, daysRemaining),
      requirementLine:
        variant === "Night"
          ? "3 night takeoffs and landings within the last 90 days"
          : "3 takeoffs and landings within the last 90 days",
      actionLine: outstanding.length
        ? `Needs ${outstanding.join(" &")}`
        : "All requirements satisfied",
    };
  };

  const pickPrimarySnapshot = (
    first: TolSnapshot,
    second: TolSnapshot,
  ): TolSnapshot => {
    if (statusPriority[first.status] > statusPriority[second.status])
      return first;
    if (statusPriority[first.status] < statusPriority[second.status])
      return second;

    const firstExpiry = first.currencyExpiry ?? Number.POSITIVE_INFINITY;
    const secondExpiry = second.currencyExpiry ?? Number.POSITIVE_INFINITY;
    if (firstExpiry < secondExpiry) return first;
    if (secondExpiry < firstExpiry) return second;

    const firstDays = first.daysRemaining ?? Number.POSITIVE_INFINITY;
    const secondDays = second.daysRemaining ?? Number.POSITIVE_INFINITY;
    if (firstDays < secondDays) return first;
    if (secondDays < firstDays) return second;

    return first;
  };

  const makeIFRItem = (report: IFRReport): IFRSummary => {
    const expiry = report.currencyExpiry > 0 ? report.currencyExpiry : null;
    const daysRemaining = computeDaysRemaining(expiry);
    const status: CurrencyStatus = !report.isCurrent
      ? "expired"
      : daysRemaining !== null && daysRemaining <= 30
        ? "at-risk"
        : "current";

    const outstanding: string[] = [];
    if (!report.ipc) {
      const approachesNeeded = Math.max(0, 6 - report.approaches);
      const holdsNeeded = Math.max(0, 1 - report.holds);
      if (approachesNeeded > 0)
        outstanding.push(pluralize(approachesNeeded, "approach", "approaches"));
      if (holdsNeeded > 0) outstanding.push(pluralize(holdsNeeded, "hold"));
    }

    const actionLine = report.ipc
      ? `IPC ${report.ipc.startTime_utc ? `on ${dateToDateStringFormMonthDayYear(report.ipc.startTime_utc)}` : "logged"}`
      : outstanding.length
        ? `Needs ${outstanding.join(" &")}`
        : "All requirements satisfied";

    return {
      id: "ifr-airplane",
      title: "Instrument (IFR)",
      subtitle: "ASEL / AMEL / seaplane combined",
      group: "IFR",
      variant: "Instrument",
      status,
      statusLabel: statusLabels[status],
      currencyExpiry: expiry,
      daysRemaining,
      expiryLabel: makeExpiryLabel(status, expiry, daysRemaining),
      requirementLine: report.ipc
        ? "Instrument Proficiency Check within the last 6 months"
        : "6 approaches and holding within the last 6 months",
      actionLine,
      windowDays: IFR_WINDOW_DAYS,
      reportType: "ifr",
      report,
    };
  };

  const makeCombinedItem = ({
    id,
    title,
    group,
    subtitle,
    variant,
    report,
    combinedKind,
    requirementLine,
  }: {
    id: string;
    title: string;
    group: string;
    subtitle?: string;
    variant: string;
    report: { general: TolReport; night: TolReport };
    combinedKind: "class" | "type";
    requirementLine?: string;
  }): CombinedSummary => {
    const daySnapshot = deriveTolSnapshot(report.general, "General");
    const nightSnapshot = deriveTolSnapshot(report.night, "Night");
    const primarySnapshot = pickPrimarySnapshot(daySnapshot, nightSnapshot);

    return {
      id,
      title,
      subtitle,
      group,
      variant,
      status: primarySnapshot.status,
      statusLabel: statusLabels[primarySnapshot.status],
      currencyExpiry: primarySnapshot.currencyExpiry,
      daysRemaining: primarySnapshot.daysRemaining,
      expiryLabel: primarySnapshot.expiryLabel,
      requirementLine:
        requirementLine ??
        "Day: 3 takeoffs & landings • Night: 3 night takeoffs & landings (90 days)",
      actionLine: `Day — ${daySnapshot.actionLine} • Night — ${nightSnapshot.actionLine}`,
      windowDays: TOL_WINDOW_DAYS,
      reportType: "combined",
      report,
      combinedKind,
      day: daySnapshot,
      night: nightSnapshot,
    };
  };

  const summaryItems = $derived.by(() => {
    const items: CurrencySummary[] = [
      makeCombinedItem({
        id: "class-asel",
        title: "ASEL",
        group: "Class Currency",
        variant: "Category & Class",
        subtitle: "Category & class passenger currency",
        combinedKind: "class",
        report: {
          general: data.currency.asel.general,
          night: data.currency.asel.night,
        },
      }),
      makeCombinedItem({
        id: "class-amel",
        title: "AMEL",
        group: "Class Currency",
        variant: "Category & Class",
        subtitle: "Multiengine category & class currency",
        combinedKind: "class",
        report: {
          general: data.currency.amel.general,
          night: data.currency.amel.night,
        },
      }),
      makeIFRItem(data.currency.ifr),
    ];

    for (const type of data.currency.types) {
      const descriptor = `${type.type.make} ${type.type.model}`;
      items.push(
        makeCombinedItem({
          id: `type-${type.type.id}`,
          title: descriptor,
          group: type.type.typeCode,
          variant: "Type Rating",
          report: { general: type.general, night: type.night },
          subtitle: "Type rating currency",
          combinedKind: "type",
        }),
      );
    }

    return items;
  });

  // Class and instrument currency apply to the pilot; type ratings are a
  // per-aircraft list that grows, so the two are shown as separate groups.
  const classItems = $derived(
    summaryItems.filter((item) => item.variant !== "Type Rating"),
  );
  const typeItems = $derived(
    summaryItems.filter((item) => item.variant === "Type Rating"),
  );

  let selectedId: string | null = $state(null);

  const selected = $derived.by(() => {
    if (!summaryItems.length) return null;
    if (selectedId) {
      const found = summaryItems.find((item) => item.id === selectedId);
      if (found) return found;
    }
    return summaryItems[0];
  });

  $effect(() => {
    if (!summaryItems.length) {
      selectedId = null;
      return;
    }

    if (selectedId && !summaryItems.some((item) => item.id === selectedId)) {
      selectedId = summaryItems[0]?.id ?? null;
    }
  });

  const nextToExpire = $derived.by(() =>
    summaryItems
      .filter(
        (item) => item.currencyExpiry !== null && item.status !== "expired",
      )
      .slice()
      .sort(
        (a, b) =>
          (a.currencyExpiry ?? Number.POSITIVE_INFINITY) -
          (b.currencyExpiry ?? Number.POSITIVE_INFINITY),
      )
      .slice(0, 6),
  );

  const expiredItems = $derived.by(() =>
    summaryItems.filter((item) => item.status === "expired"),
  );
  const atRiskItems = $derived.by(() =>
    summaryItems.filter((item) => item.status === "at-risk"),
  );

  const timeline = $derived.by(() => {
    if (!selected || selected.currencyExpiry === null) return null;
    const windowSeconds = selected.windowDays * DAY_SECONDS;
    if (!windowSeconds) return null;

    const end = selected.currencyExpiry;
    const start = end - windowSeconds;
    const progressSeconds = data.nowSeconds - start;
    const progress = Math.min(Math.max(progressSeconds / windowSeconds, 0), 1);

    return {
      start,
      end,
      progressPercent: Math.round(progress * 100),
    };
  });

  const formatDate = (seconds: number | null) =>
    seconds ? dateToDateStringFormMonthDayYear(seconds) : undefined;

  const selectedTol = $derived.by(() =>
    selected && selected.reportType === "tol" ? selected.report : null,
  );
  const selectedCombined = $derived.by(() =>
    selected && selected.reportType === "combined" ? selected : null,
  );
  const selectedIFR = $derived.by(() =>
    selected && selected.reportType === "ifr" ? selected.report : null,
  );
</script>

<OneColumn>
  <div class="space-y-6 p-4">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold tracking-tight">Currency</h1>
      <p class="text-sm text-muted-foreground">
        Monitor day, night, and instrument currency at a glance. Select a card
        to drill into the qualifying activity and see what is needed next.
      </p>
    </header>

    {#if expiredItems.length > 0}
      <div
        class="rounded-2xl border border-rose-200/60 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30"
      >
        <div class="flex items-start gap-3">
          <AlertTriangle
            class="mt-0.5 h-5 w-5 text-rose-500 dark:text-rose-400"
          />
          <div class="space-y-1">
            <p class="text-sm font-semibold text-rose-700 dark:text-rose-200">
              Out of currency
            </p>
            <ul
              class="space-y-1 text-sm text-rose-700/80 dark:text-rose-200/80"
            >
              {#each expiredItems.slice(0, 4) as item (item.id)}
                <li>
                  <span class="font-medium">{item.title}</span>
                  <span class="px-1 text-rose-500">•</span>
                  {item.requirementLine}
                </li>
              {/each}
            </ul>
            {#if expiredItems.length > 4}
              <p class="text-xs text-rose-600/80 dark:text-rose-200/70">
                +{expiredItems.length - 4} more currencies currently expired.
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if atRiskItems.length > 0}
      <div
        class="rounded-2xl border border-amber-200/60 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30"
      >
        <div class="flex items-start gap-3">
          <Clock3 class="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
          <div class="space-y-1">
            <p class="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Expiring soon
            </p>
            <ul
              class="space-y-1 text-sm text-amber-700/80 dark:text-amber-200/80"
            >
              {#each atRiskItems.slice(0, 4) as item (item.id)}
                <li>
                  <span class="font-medium">{item.title}</span>
                  <span class="px-1 text-amber-500">•</span>
                  {item.expiryLabel}
                </li>
              {/each}
            </ul>
            {#if atRiskItems.length > 4}
              <p class="text-xs text-amber-600/80 dark:text-amber-200/70">
                +{atRiskItems.length - 4} more currencies nearing expiration.
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <div class="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <section class="space-y-6">
        <div class="space-y-2">
          <div class="flex items-baseline gap-2">
            <h2 class="text-sm font-semibold">Class &amp; Instrument</h2>
            <span class="text-xxs text-muted-foreground"
              >Category, class and IFR currency</span
            >
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {#each classItems as item (item.id)}
              <button
                type="button"
                class={`group bg-card text-card-foreground hover:border-primary/40 flex flex-col gap-2.5 rounded-lg border p-3 text-left shadow-xs transition-colors ${selected?.id === item.id ? "ring-primary ring-2" : ""}`}
                onclick={() => (selectedId = item.id)}
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      {item.group}
                    </p>
                    <p class="text-sm font-semibold leading-tight">
                      {item.title}
                    </p>
                    {#if item.subtitle}
                      <p class="text-xxs text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </p>
                    {/if}
                  </div>
                  <span
                    class={`rounded-full px-2 py-0.5 text-xxs font-semibold uppercase tracking-wide ${statusBadgeClass[item.status]}`}
                  >
                    {item.statusLabel}
                  </span>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-end justify-between gap-3">
                    {#if item.reportType === "combined"}
                      <div class="flex w-full gap-2">
                        <div class="bg-muted/50 flex-1 rounded-md border p-2">
                          <p
                            class="text-xxs uppercase tracking-wide text-muted-foreground"
                          >
                            Day
                          </p>
                          <p
                            class={`text-sm font-semibold ${statusTextClass[item.day.status]}`}
                          >
                            {item.day.status === "expired"
                              ? "Expired"
                              : item.day.daysRemaining !== null
                                ? `${item.day.daysRemaining}d left`
                                : "Active"}
                          </p>
                          <p class="text-xxs text-muted-foreground">
                            {item.day.expiryLabel}
                          </p>
                        </div>
                        <div class="bg-muted/50 flex-1 rounded-md border p-2">
                          <p
                            class="text-xxs uppercase tracking-wide text-muted-foreground"
                          >
                            Night
                          </p>
                          <p
                            class={`text-sm font-semibold ${statusTextClass[item.night.status]}`}
                          >
                            {item.night.status === "expired"
                              ? "Expired"
                              : item.night.daysRemaining !== null
                                ? `${item.night.daysRemaining}d left`
                                : "Active"}
                          </p>
                          <p class="text-xxs text-muted-foreground">
                            {item.night.expiryLabel}
                          </p>
                        </div>
                      </div>
                    {:else if item.daysRemaining !== null && item.status !== "expired"}
                      <div class="text-xl font-semibold">
                        {item.daysRemaining}
                        <span
                          class="ml-2 text-sm font-medium text-muted-foreground"
                          >days left</span
                        >
                      </div>
                    {:else}
                      <div class="text-sm font-medium text-muted-foreground">
                        {item.expiryLabel}
                      </div>
                    {/if}
                  </div>

                  <div class="text-xxs space-y-0.5 text-muted-foreground">
                    {#if item.reportType === "combined"}
                      <p>{item.requirementLine}</p>
                      <p
                        class={`font-medium ${statusTextClass[item.day.status]}`}
                      >
                        Day — {item.day.actionLine}
                      </p>
                      <p
                        class={`font-medium ${statusTextClass[item.night.status]}`}
                      >
                        Night — {item.night.actionLine}
                      </p>
                    {:else}
                      <p>{item.requirementLine}</p>
                      <p class={`font-medium ${statusTextClass[item.status]}`}>
                        {item.actionLine}
                      </p>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        {#if typeItems.length > 0}
          <div class="space-y-2">
            <div class="flex items-baseline gap-2">
              <h2 class="text-sm font-semibold">Type Ratings</h2>
              <span class="text-xxs text-muted-foreground"
                >Per-aircraft takeoff and landing currency</span
              >
            </div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {#each typeItems as item (item.id)}
                <button
                  type="button"
                  class={`group bg-card text-card-foreground hover:border-primary/40 flex flex-col gap-2.5 rounded-lg border p-3 text-left shadow-xs transition-colors ${selected?.id === item.id ? "ring-primary ring-2" : ""}`}
                  onclick={() => (selectedId = item.id)}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        {item.group}
                      </p>
                      <p class="text-sm font-semibold leading-tight">
                        {item.title}
                      </p>
                      {#if item.subtitle}
                        <p class="text-xxs text-muted-foreground mt-0.5">
                          {item.subtitle}
                        </p>
                      {/if}
                    </div>
                    <span
                      class={`rounded-full px-2 py-0.5 text-xxs font-semibold uppercase tracking-wide ${statusBadgeClass[item.status]}`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-end justify-between gap-3">
                      {#if item.reportType === "combined"}
                        <div class="flex w-full gap-2">
                          <div class="bg-muted/50 flex-1 rounded-md border p-2">
                            <p
                              class="text-xxs uppercase tracking-wide text-muted-foreground"
                            >
                              Day
                            </p>
                            <p
                              class={`text-sm font-semibold ${statusTextClass[item.day.status]}`}
                            >
                              {item.day.status === "expired"
                                ? "Expired"
                                : item.day.daysRemaining !== null
                                  ? `${item.day.daysRemaining}d left`
                                  : "Active"}
                            </p>
                            <p class="text-xxs text-muted-foreground">
                              {item.day.expiryLabel}
                            </p>
                          </div>
                          <div class="bg-muted/50 flex-1 rounded-md border p-2">
                            <p
                              class="text-xxs uppercase tracking-wide text-muted-foreground"
                            >
                              Night
                            </p>
                            <p
                              class={`text-sm font-semibold ${statusTextClass[item.night.status]}`}
                            >
                              {item.night.status === "expired"
                                ? "Expired"
                                : item.night.daysRemaining !== null
                                  ? `${item.night.daysRemaining}d left`
                                  : "Active"}
                            </p>
                            <p class="text-xxs text-muted-foreground">
                              {item.night.expiryLabel}
                            </p>
                          </div>
                        </div>
                      {:else if item.daysRemaining !== null && item.status !== "expired"}
                        <div class="text-xl font-semibold">
                          {item.daysRemaining}
                          <span
                            class="ml-2 text-sm font-medium text-muted-foreground"
                            >days left</span
                          >
                        </div>
                      {:else}
                        <div class="text-sm font-medium text-muted-foreground">
                          {item.expiryLabel}
                        </div>
                      {/if}
                    </div>

                    <div class="text-xxs space-y-0.5 text-muted-foreground">
                      {#if item.reportType === "combined"}
                        <p>{item.requirementLine}</p>
                        <p
                          class={`font-medium ${statusTextClass[item.day.status]}`}
                        >
                          Day — {item.day.actionLine}
                        </p>
                        <p
                          class={`font-medium ${statusTextClass[item.night.status]}`}
                        >
                          Night — {item.night.actionLine}
                        </p>
                      {:else}
                        <p>{item.requirementLine}</p>
                        <p
                          class={`font-medium ${statusTextClass[item.status]}`}
                        >
                          {item.actionLine}
                        </p>
                      {/if}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="bg-card text-card-foreground rounded-lg border shadow-xs">
          <div class="space-y-5 p-6">
            {#if selected}
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p
                    class="text-xxs uppercase tracking-wide text-muted-foreground"
                  >
                    {selected.group}
                  </p>
                  <h2 class="text-2xl font-semibold">
                    {selected.title}
                  </h2>
                  {#if selected.subtitle}
                    <p class="text-sm text-muted-foreground">
                      {selected.subtitle}
                    </p>
                  {/if}
                </div>
                <span
                  class={`rounded-full px-3 py-1 text-xxs font-semibold uppercase tracking-wide ${statusBadgeClass[selected.status]}`}
                >
                  {selected.statusLabel}
                </span>
              </div>

              {#if selected.reportType === "tol" && selectedTol}
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="space-y-2 text-sm text-muted-foreground">
                    <p>{selected.requirementLine}</p>
                    <p
                      class={`font-medium ${statusTextClass[selected.status]}`}
                    >
                      {selected.actionLine}
                    </p>
                    {#if selected.currencyExpiry}
                      <p>Expires {formatDate(selected.currencyExpiry)}</p>
                    {:else if selected.status === "expired"}
                      <p>
                        No qualifying activity in the current lookback window.
                      </p>
                    {/if}
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        Takeoffs counted
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedTol.takeoffs}
                      </p>
                    </div>
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        Landings counted
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedTol.landings}
                      </p>
                    </div>
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        Recent flights
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedTol.entries.affecting.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Recent qualifying flights
                  </h3>
                  {#if selectedTol.entries.affecting.length > 0}
                    <div class="overflow-hidden rounded-lg border">
                      <table class="min-w-full divide-y divide-border text-xs">
                        <thead class="bg-muted text-muted-foreground">
                          <tr>
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Date</th
                            >
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Aircraft</th
                            >
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Day T/O &amp; Ldg
                            </th>
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Night T/O &amp; Ldg
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                          {#each selectedTol.entries.affecting.slice(0, 8) as leg}
                            <tr class="bg-card odd:bg-muted/40">
                              <td class="px-3 py-2 font-mono">
                                {formatDate(leg.startTime_utc) ?? "—"}
                              </td>
                              <td class="px-3 py-2">
                                {leg.aircraft?.registration ?? "—"}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.dayTakeOffs}/{leg.dayLandings}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.nightTakeOffs}/{leg.nightLandings}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <p class="text-sm text-muted-foreground">
                      No qualifying flights logged within the last 90 days.
                    </p>
                  {/if}
                </div>
              {:else if selected.reportType === "combined" && selectedCombined}
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="space-y-2 text-sm text-muted-foreground">
                    <p class="text-sm font-semibold">Day currency</p>
                    <p>{selectedCombined.day.requirementLine}</p>
                    <p
                      class={`font-medium ${statusTextClass[selectedCombined.day.status]}`}
                    >
                      {selectedCombined.day.actionLine}
                    </p>
                    {#if selectedCombined.day.currencyExpiry}
                      <p>
                        Expires {formatDate(
                          selectedCombined.day.currencyExpiry,
                        )}
                      </p>
                    {:else if selectedCombined.day.status === "expired"}
                      <p>No qualifying day activity in the last 90 days.</p>
                    {:else}
                      <p>Currency active.</p>
                    {/if}
                  </div>
                  <div class="space-y-2 text-sm text-muted-foreground">
                    <p class="text-sm font-semibold">Night currency</p>
                    <p>{selectedCombined.night.requirementLine}</p>
                    <p
                      class={`font-medium ${statusTextClass[selectedCombined.night.status]}`}
                    >
                      {selectedCombined.night.actionLine}
                    </p>
                    {#if selectedCombined.night.currencyExpiry}
                      <p>
                        Expires {formatDate(
                          selectedCombined.night.currencyExpiry,
                        )}
                      </p>
                    {:else if selectedCombined.night.status === "expired"}
                      <p>No qualifying night activity in the last 90 days.</p>
                    {:else}
                      <p>Currency active.</p>
                    {/if}
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-3">
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Day takeoffs
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.general.takeoffs}
                    </p>
                  </div>
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Day landings
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.general.landings}
                    </p>
                  </div>
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Day flights
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.general.entries.affecting.length}
                    </p>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-3">
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Night takeoffs
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.night.takeoffs}
                    </p>
                  </div>
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Night landings
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.night.landings}
                    </p>
                  </div>
                  <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                    <p
                      class="text-xxs uppercase tracking-wide text-muted-foreground"
                    >
                      Night flights
                    </p>
                    <p class="text-lg font-semibold">
                      {selectedCombined.report.night.entries.affecting.length}
                    </p>
                  </div>
                </div>

                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Day qualifying flights
                  </h3>
                  {#if selectedCombined.report.general.entries.affecting.length > 0}
                    <div class="overflow-hidden rounded-lg border">
                      <table class="min-w-full divide-y divide-border text-xs">
                        <thead class="bg-muted text-muted-foreground">
                          <tr>
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Date</th
                            >
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Aircraft</th
                            >
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Day T/O &amp; Ldg
                            </th>
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Night T/O &amp; Ldg
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                          {#each selectedCombined.report.general.entries.affecting.slice(0, 8) as leg}
                            <tr class="bg-card odd:bg-muted/40">
                              <td class="px-3 py-2 font-mono">
                                {formatDate(leg.startTime_utc) ?? "—"}
                              </td>
                              <td class="px-3 py-2">
                                {leg.aircraft?.registration ?? "—"}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.dayTakeOffs}/{leg.dayLandings}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.nightTakeOffs}/{leg.nightLandings}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <p class="text-sm text-muted-foreground">
                      No day qualifying flights logged within the last 90 days.
                    </p>
                  {/if}
                </div>

                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Night qualifying flights
                  </h3>
                  {#if selectedCombined.report.night.entries.affecting.length > 0}
                    <div class="overflow-hidden rounded-lg border">
                      <table class="min-w-full divide-y divide-border text-xs">
                        <thead class="bg-muted text-muted-foreground">
                          <tr>
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Date</th
                            >
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Aircraft</th
                            >
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Night T/O &amp; Ldg
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                          {#each selectedCombined.report.night.entries.affecting.slice(0, 8) as leg}
                            <tr class="bg-card odd:bg-muted/40">
                              <td class="px-3 py-2 font-mono">
                                {formatDate(leg.startTime_utc) ?? "—"}
                              </td>
                              <td class="px-3 py-2">
                                {leg.aircraft?.registration ?? "—"}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.nightTakeOffs}/{leg.nightLandings}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <p class="text-sm text-muted-foreground">
                      No night qualifying flights logged within the last 90
                      days.
                    </p>
                  {/if}
                </div>
              {:else if selected.reportType === "ifr" && selectedIFR}
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="space-y-2 text-sm text-muted-foreground">
                    <p>{selected.requirementLine}</p>
                    <p
                      class={`font-medium ${statusTextClass[selected.status]}`}
                    >
                      {selected.actionLine}
                    </p>
                    {#if selected.currencyExpiry}
                      <p>Expires {formatDate(selected.currencyExpiry)}</p>
                    {:else if selected.status === "expired"}
                      <p>
                        No instrument activity in the current lookback window.
                      </p>
                    {/if}
                  </div>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        Approaches
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedIFR.approaches}
                      </p>
                    </div>
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        Holding
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedIFR.holds}
                      </p>
                    </div>
                    <div class="bg-muted/50 rounded-lg border p-3 text-sm">
                      <p
                        class="text-xxs uppercase tracking-wide text-muted-foreground"
                      >
                        IPC
                      </p>
                      <p class="text-lg font-semibold">
                        {selectedIFR.ipc ? "Logged" : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <h3
                    class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Instrument activity log
                  </h3>
                  {#if selectedIFR.entries.affecting.length > 0}
                    <div class="overflow-hidden rounded-lg border">
                      <table class="min-w-full divide-y divide-border text-xs">
                        <thead class="bg-muted text-muted-foreground">
                          <tr>
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Date</th
                            >
                            <th
                              class="px-3 py-2 text-left font-medium uppercase tracking-wide"
                              >Aircraft</th
                            >
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Approaches
                            </th>
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                            >
                              Holds
                            </th>
                            <th
                              class="px-3 py-2 text-right font-medium uppercase tracking-wide"
                              >IPC</th
                            >
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                          {#each selectedIFR.entries.affecting.slice(0, 8) as leg}
                            <tr class="bg-card odd:bg-muted/40">
                              <td class="px-3 py-2 font-mono">
                                {formatDate(leg.startTime_utc) ?? "—"}
                              </td>
                              <td class="px-3 py-2">
                                {leg.aircraft?.registration ?? "—"}
                              </td>
                              <td class="px-3 py-2 text-right">
                                {leg.approaches?.length ?? 0}
                              </td>
                              <td class="px-3 py-2 text-right"
                                >{leg.holds ?? 0}</td
                              >
                              <td class="px-3 py-2 text-right">
                                {leg.ipc ? "Yes" : "No"}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <p class="text-sm text-muted-foreground">
                      No instrument approaches, holding, or IPC logged within
                      the last 6 months.
                    </p>
                  {/if}
                </div>
              {:else}
                <p class="text-sm text-muted-foreground">
                  Detailed data for this currency type is not available.
                </p>
              {/if}
            {:else}
              <p class="text-sm text-muted-foreground">
                Select a currency card above to see the qualifying flights and
                requirements.
              </p>
            {/if}
          </div>
        </div>
      </section>

      <aside class="space-y-6">
        <div class="bg-card text-card-foreground rounded-lg border shadow-xs">
          <div class="space-y-5 p-6">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary rounded-lg p-2">
                <BookCheck class="h-5 w-5" />
              </div>
              <div>
                <h3 class="text-base font-semibold">Expiry timeline</h3>
                <p class="text-xs text-muted-foreground">
                  Compare today against the lookback window for the selected
                  currency.
                </p>
              </div>
            </div>

            {#if selected && timeline}
              <div class="space-y-3">
                <div
                  class="flex items-center justify-between text-sm font-medium"
                >
                  <span>{selected.title}</span>
                  <span
                    class={`rounded-full px-2 py-0.5 text-xxs font-semibold uppercase tracking-wide ${statusBadgeClass[selected.status]}`}
                  >
                    {selected.statusLabel}
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-muted">
                  <div
                    class={`h-full rounded-full transition-all ${selected.status === "expired" ? "bg-destructive" : "bg-primary"}`}
                    style={`width: ${timeline.progressPercent}%`}
                  ></div>
                </div>
                <div
                  class="flex justify-between text-xxs font-mono uppercase text-muted-foreground"
                >
                  <span>{formatDate(timeline.start) ?? "—"}</span>
                  <span>{formatDate(data.nowSeconds)}</span>
                  <span>{formatDate(timeline.end) ?? "—"}</span>
                </div>
                <p class="text-xs text-muted-foreground">
                  {selected.expiryLabel}
                </p>
                {#if selected.reportType === "combined"}
                  <div class="grid gap-2 text-xs text-muted-foreground">
                    <div class="flex items-center justify-between">
                      <span>Day</span>
                      <span
                        class={`font-medium ${statusTextClass[selected.day.status]}`}
                      >
                        {selected.day.expiryLabel}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Night</span>
                      <span
                        class={`font-medium ${statusTextClass[selected.night.status]}`}
                      >
                        {selected.night.expiryLabel}
                      </span>
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <p class="text-sm text-muted-foreground">
                Select a currency with an active expiry window to visualize
                progress through the lookback period.
              </p>
            {/if}
          </div>
        </div>

        <div class="bg-card text-card-foreground rounded-lg border shadow-xs">
          <div class="space-y-5 p-6">
            <div class="flex items-center gap-3">
              <div class="bg-muted text-muted-foreground rounded-lg p-2">
                <Clock3 class="h-5 w-5" />
              </div>
              <div>
                <h3 class="text-base font-semibold">Next to expire</h3>
                <p class="text-xs text-muted-foreground">
                  Upcoming deadlines across every tracked currency.
                </p>
              </div>
            </div>

            {#if nextToExpire.length > 0}
              <ul class="space-y-3">
                {#each nextToExpire as item (item.id)}
                  <li
                    class="hover:border-primary/40 hover:bg-accent/50 flex items-center justify-between gap-3 rounded-lg border border-transparent bg-muted p-3 transition-colors"
                  >
                    <div>
                      <p class="text-sm font-medium">
                        {item.title}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        {item.requirementLine}
                      </p>
                    </div>
                    <div class="text-right">
                      {#if item.daysRemaining !== null}
                        <p
                          class={`text-sm font-semibold ${statusTextClass[item.status]}`}
                        >
                          {item.daysRemaining === 0
                            ? "Today"
                            : `${item.daysRemaining}d left`}
                        </p>
                      {:else}
                        <p
                          class={`text-sm font-semibold ${statusTextClass[item.status]}`}
                        >
                          {item.statusLabel}
                        </p>
                      {/if}
                      <p class="text-xxs text-muted-foreground">
                        {item.currencyExpiry
                          ? formatDate(item.currencyExpiry)
                          : "—"}
                      </p>
                    </div>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-muted-foreground">
                No upcoming expirations detected from current flight activity.
              </p>
            {/if}
          </div>
        </div>
      </aside>
    </div>
  </div>
</OneColumn>
