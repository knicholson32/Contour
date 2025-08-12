<script lang="ts">
  import { goto } from "$app/navigation";
  import type { API } from "$lib/types";
  import { onMount } from "svelte";

  const today = new Date();

  export let startUnix: number = today.getTime() / 1000;


  const date = new Date(startUnix * 1000);

  let todayDay = today.getDate();
  let todayMonth = today.getMonth();
  let todayYear = today.getFullYear();


  export let currentMonth = date.getMonth();
  export let currentYear = date.getFullYear();

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  type YearMonth = { year: number, month: number };

  const wrapYearMonth = (currentYear: number, currentMonth: number, forward: boolean): YearMonth => {
    if (forward) {
      if (currentMonth + 1 >= 12) return { year: currentYear + 1, month: 0 };
      else return { year: currentYear, month: currentMonth + 1 };
    } else {
      if (currentMonth - 1 < 0) return { year: currentYear - 1, month: 11 };
      else return { year: currentYear, month: currentMonth - 1 };
    }
  }

  $: monthString = months[currentMonth] + ' ' + currentYear;
  let numDays: { previous: number, current: number, next: number };
  let startDay: number;

  let cal: {
    numDays: {
      previous: number,
      current: number,
      next: number
    },
    startDay: number,
    isCurrentMonth: boolean,
    n: YearMonth,
    p: YearMonth,
    c: YearMonth,
  }

  let p: YearMonth;
  let n: YearMonth;

  const refreshCal = () => {
    p = wrapYearMonth(currentYear, currentMonth, false);
    n = wrapYearMonth(currentYear, currentMonth, true);
    numDays = {
      previous: (new Date(Date.UTC(p.year, p.month + 1, 0))).getUTCDate(),
      current: (new Date(Date.UTC(currentYear, currentMonth + 1, 0))).getUTCDate(),
      next: (new Date(Date.UTC(n.year, n.month + 1, 0))).getUTCDate(),
    };
    startDay = (new Date(Date.UTC(currentYear, currentMonth, 0))).getUTCDay() + 1;
    if (startDay === 7) startDay = 0;

    cal = {
      numDays,
      startDay,
      isCurrentMonth: currentYear === todayYear && currentMonth === todayMonth,
      p,
      n,
      c: {
        year: currentYear,
        month: currentMonth
      }
    }
  };

  let tours: API.Types.Tour[] = [];

  const pullTours = async () => {
    p = wrapYearMonth(currentYear, currentMonth, false);
    n = wrapYearMonth(currentYear, currentMonth, true);
    const t = await fetch(`/api/tours/?start=${new Date(Date.UTC(p.year, p.month, 0)).getTime() / 1000}&end=${new Date(Date.UTC(n.year, n.month, 0)).getTime() / 1000 + 3000000}`);
    const toursAPI = (await t.json()) as API.TourList;
    if (toursAPI.ok === true && toursAPI.type === 'tours') {
      console.log(toursAPI);
      tours = toursAPI.tours;
    }
    refreshCal();
  }

  const findTour = (day: number, month: number, year: number): API.Types.Tour | null => {
    const d = new Date(year, month, day);
    let currentDayStart = d.getTime() / 1000;
    let currentDayEnd = d.getTime() / 1000 + 86400;
    for (const t of tours) {
      const startTime = t.startTime_utc;
      const endTime = t.endTime_utc === null ? null : t.endTime_utc;
      if (endTime === null) {
        if (startTime <= currentDayEnd) return t;
      } else {
        if (startTime <= currentDayEnd && endTime >= currentDayStart) return t;
      }
    }
    return null;
  }

  const getIsTourDay = (day: number, month: number, year: number) => findTour(day, month, year) !== null;

  const selectDay = async (day: number, month: number, year: number) => {
    const t = findTour(day, month, year);
    if (t !== null) {
      await goto('/tour/'+t.id);
    }
  }

  const nextMonth = async () => {
    currentMonth = currentMonth + 1;
    if (currentMonth >= 12) {
      currentMonth = 0;
      currentYear = currentYear + 1;
    }
    await pullTours()
  };

  const previousMonth = async () => {
    currentMonth = currentMonth - 1;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear = currentYear - 1;
    }
    await pullTours()
  };

  refreshCal();

  onMount(async () => {
    await pullTours();
  });

</script>


  <div class="text-center lg:col-start-8 lg:col-end-13 lg:row-start-1 lg:mt-9 xl:col-start-9">
    <div class="flex items-center">
      <button type="button" on:click={previousMonth} class="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 betterhover:hover:text-gray-500 dark:betterhover:hover:text-gray-200">
        <span class="sr-only">Previous month</span>
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
        </svg>
      </button>
      <div class="flex-auto text-sm font-semibold dark:">{monthString}</div>
      <button type="button" on:click={nextMonth} class="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 betterhover:hover:text-gray-500 dark:betterhover:hover:text-gray-200">
        <span class="sr-only">Next month</span>
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div class="mt-6 grid grid-cols-7 text-xs leading-6 ">
      <div>S</div>
      <div>M</div>
      <div>T</div>
      <div>W</div>
      <div>T</div>
      <div>F</div>
      <div>S</div>
    </div>

    <div class="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 dark:bg-zinc-800 text-sm shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700">

      {#key cal}
        <!-- Previous Month -->
        {#each {length: cal.startDay} as _, i }
          <button type="button" on:click={() => selectDay(cal.numDays.previous - (-i + cal.startDay - 1), cal.p.month, cal.p.year)} class="{i === 0 ? 'rounded-tl-lg' : ''} bg-gray-50 dark:bg-zinc-900 py-1.5 text-gray-400 dark:text-gray-500 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 focus:z-10 relative">
            {#if getIsTourDay(cal.numDays.previous - (-i + cal.startDay - 1), cal.p.month, cal.p.year)}
              <div class="absolute h-1 bg-slate-300 left-2 right-2 bottom-1 rounded-full"></div>
            {/if}
            <time datetime="2021-12-27" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">{cal.numDays.previous - (-i + cal.startDay - 1)}</time>
          </button>
        {/each}

        <!-- Current Month -->
        {#each {length: cal.numDays.current} as _, i}
          <button type="button" on:click={() => selectDay(i + 1, cal.c.month, cal.c.year)} class="
            {i + cal.startDay === 0 ? 'rounded-tl-lg' : ''}
            {i + cal.startDay === 6 ? 'rounded-tr-lg' : ''}
            {(cal.startDay + i) % 7 === 0 && cal.numDays.current - i <= 7 ? 'rounded-bl-lg' : ''}
            {(7 - (cal.startDay + cal.numDays.current) % 7) === 7 && i === cal.numDays.current - 1 ? 'rounded-br-lg' : ''}
            {cal.isCurrentMonth && i === todayDay ? 'font-semibold text-indigo-600' : ''}
            bg-white dark:bg-zinc-950 py-1.5 text-gray-900 dark:text-gray-200 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 focus:z-10 relative">
            {#if getIsTourDay(i + 1, cal.c.month, cal.c.year)}
              <div class="absolute h-1 bg-sky-500 left-2 right-2 bottom-1 rounded-full"></div>
            {/if}
            <time datetime="{cal.c.year}-{cal.c.month + 1}-{i + 1}" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">{i + 1}</time>
          </button>
        {/each}

        <!-- Next Month -->
        {#if (7 - (cal.startDay + cal.numDays.current) % 7) !== 7}
          {#each {length: (7 - (cal.startDay + cal.numDays.current) % 7)} as _, i}
            <button type="button" on:click={() => selectDay(i + 1, cal.n.month, cal.n.year)}  class="{i === (7 - (cal.startDay + cal.numDays.current) % 7) - 1 ? 'rounded-br-lg' : ''} bg-gray-50 dark:bg-zinc-900 py-1.5 text-gray-400 dark:text-gray-500 betterhover:hover:bg-gray-100 dark:betterhover:hover:bg-zinc-800 focus:z-10 relative">
              {#if getIsTourDay(i + 1, n.month, n.year)}
                <div class="absolute h-1 bg-slate-300 left-2 right-2 bottom-1 rounded-full"></div>
              {/if}
              <time datetime="2021-12-27" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">{i + 1}</time>
            </button>
          {/each}
        {/if}
      {/key}

    </div>

    <div class="hidden isolate mt-2 grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-sm ring-1 ring-gray-200">
      <!--
        Always include: "py-1.5 betterhover:hover:bg-gray-100 focus:z-10"
        Is current month, include: "bg-white"
        Is not current month, include: "bg-gray-50"
        Is selected or is today, include: "font-semibold"
        Is selected, include: "text-white"
        Is not selected, is not today, and is current month, include: "text-gray-900"
        Is not selected, is not today, and is not current month, include: "text-gray-400"
        Is today and is not selected, include: "text-indigo-600"

        Top left day, include: "rounded-tl-lg"
        Top right day, include: "rounded-tr-lg"
        Bottom left day, include: "rounded-bl-lg"
        Bottom right day, include: "rounded-br-lg"
      -->
      <button type="button" class="rounded-tl-lg bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <!--
          Always include: "mx-auto flex h-7 w-7 items-center justify-center rounded-full"
          Is selected and is today, include: "bg-indigo-600"
          Is selected and is not today, include: "bg-gray-900"
        -->
        <time datetime="2021-12-27" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">27</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2021-12-28" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">28</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2021-12-29" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">29</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2021-12-30" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">30</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2021-12-31" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">31</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-01" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">1</time>
      </button>
      <button type="button" class="rounded-tr-lg bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-01" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">2</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-02" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">3</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-04" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">4</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-05" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">5</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-06" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">6</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-07" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">7</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-08" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">8</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-09" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">9</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-10" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">10</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-11" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">11</time>
      </button>
      <button type="button" class="bg-white py-1.5 font-semibold text-indigo-600 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-12" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">12</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-13" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">13</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-14" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">14</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-15" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">15</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-16" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">16</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-17" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">17</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-18" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">18</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-19" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">19</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-20" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">20</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-21" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">21</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-22" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 font-semibold text-white">22</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-23" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">23</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-24" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">24</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-25" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">25</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-26" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">26</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-27" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">27</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-28" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">28</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-29" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">29</time>
      </button>
      <button type="button" class="bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-30" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">30</time>
      </button>
      <button type="button" class="rounded-bl-lg bg-white py-1.5 text-gray-900 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-01-31" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">31</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-01" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">1</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-02" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">2</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-03" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">3</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-04" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">4</time>
      </button>
      <button type="button" class="bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-05" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">5</time>
      </button>
      <button type="button" class="rounded-br-lg bg-gray-50 py-1.5 text-gray-400 betterhover:hover:bg-gray-100 focus:z-10">
        <time datetime="2022-02-06" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full">6</time>
      </button>
    </div>
  </div>
