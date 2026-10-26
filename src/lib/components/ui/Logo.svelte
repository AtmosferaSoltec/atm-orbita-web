<script lang="ts">
	interface Props {
		size?: 'sm' | 'md';
		onDark?: boolean;
	}

	let { size = 'md', onDark = false }: Props = $props();

	const gradient = $props.id();
</script>

<span class="inline-flex items-center gap-2.5">
	<!-- The logo of the app (static/favicon.svg): the "O" in blue and celeste on its dark tile. -->
	<svg
		viewBox="0 0 512 512"
		class="rounded-xl shadow-md shadow-primary/30 {size === 'sm' ? 'size-8' : 'size-9'}"
		aria-hidden="true"
	>
		<rect width="512" height="512" fill="#1a1a1a" />
		<path
			d="M389.62,216.16C399.923,247.877 398.609,282.224 385.912,313.061C373.216,343.898 349.964,369.214 320.316,384.481C290.668,399.749 256.555,403.973 224.078,396.398C191.602,388.823 162.878,369.944 143.043,343.135C123.208,316.326 113.556,283.337 115.811,250.065C118.067,216.792 132.084,185.407 155.355,161.521C178.627,137.635 209.636,122.805 242.838,119.683C276.04,116.561 309.27,125.35 336.587,144.48L303.807,191.298C287.602,179.949 267.89,174.735 248.193,176.586C228.497,178.438 210.101,187.235 196.296,201.404C182.49,215.574 174.175,234.192 172.836,253.93C171.498,273.668 177.224,293.238 188.99,309.142C200.756,325.046 217.796,336.246 237.062,340.739C256.328,345.233 276.564,342.727 294.152,333.67C311.741,324.613 325.534,309.595 333.066,291.302C340.598,273.009 341.377,252.633 335.265,233.818L389.62,216.16Z"
			fill="url(#{gradient})"
		/>
		<defs>
			<linearGradient
				id={gradient}
				x1="256"
				y1="119.07"
				x2="256"
				y2="400.075"
				gradientUnits="userSpaceOnUse"
			>
				<stop stop-color="#2563EB" />
				<stop offset="0.5" stop-color="#0EA5E9" />
				<stop offset="1" stop-color="#67E8F9" />
			</linearGradient>
		</defs>
	</svg>
	<span
		class="font-extrabold tracking-tight {size === 'sm' ? 'text-lg' : 'text-xl'} {onDark
			? 'text-white'
			: 'text-ink'}">Orbita</span
	>
</span>
