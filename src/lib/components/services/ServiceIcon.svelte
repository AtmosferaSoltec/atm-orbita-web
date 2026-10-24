<script lang="ts">
	interface Props {
		name: string;
		color: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, color, size = 'md' }: Props = $props();

	const SIZES = {
		sm: 'size-9 rounded-xl text-sm',
		md: 'size-11 rounded-[14px] text-base',
		lg: 'size-14 rounded-2xl text-xl'
	};
</script>

<span
	class="inline-flex shrink-0 items-center justify-center font-extrabold text-white shadow-sm {SIZES[
		size
	]}"
	style="background:{color}"
	aria-hidden="true"
>
	{name.trim().charAt(0).toUpperCase() || '?'}
</span>
