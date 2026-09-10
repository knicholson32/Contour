<script lang="ts">
	import { cbaSegments } from '$lib/cba';

	interface Props {
		/** Prose that may contain CBA citations such as "19.4(H)(2)(a)" or "Section 8". */
		text: string;
	}

	let { text }: Props = $props();

	const segments = $derived(cbaSegments(text));
</script>

<!-- Kept on one line: any newline between segments would render as a space and
     break up citations that sit mid-sentence. -->
{#each segments as s}{#if s.href}<a href={s.href} target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2 hover:decoration-solid">{s.text}</a>{:else}{s.text}{/if}{/each}
