<script lang="ts">
	interface Props {
		name: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, size = 'md' }: Props = $props();

	const COLORS = ['#1D4ED8', '#0E7490', '#B45309', '#BE185D', '#7C3AED', '#0B7A5A', '#3B4A60'];
	const SIZES = { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-14 text-lg' };

	const initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((word) => word.charAt(0).toUpperCase())
			.join('')
	);
	const color = $derived(
		COLORS[[...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLORS.length]
	);
</script>

<span
	class="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold {SIZES[size]}"
	style="background:{color}1a;color:{color}"
	aria-hidden="true"
>
	{initials || '?'}
</span>
