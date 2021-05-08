<script>
	import { createClient } from '@supabase/supabase-js'
	import Logo from '$/svg/Logo.svelte'
	import LogoImage from '$/svg/LogoImage.svelte'
	import ArrowRight from '$/svg/ArrowRight.svelte'

	const supabaseUrl = "https://iklqhrrxiyjfmaiskeym.supabase.co";
	const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNzMwMzA5MiwiZXhwIjoxOTMyODc5MDkyfQ.JSXPBUiRbISJjIHiKfJK-0gsPWdRlZyZhuyHD2ClHEU'
	const supabase = createClient(supabaseUrl, supabaseKey)
	 
	let email = ''
	let error = ''
	let isEmailSent = false;
	const insertEmail = async () => {
		if(!email) {
			return;
		}

		await supabase
			.from('emails')
			.insert([{ email }], {returning: 'minimal'})
		isEmailSent = true;
	}
</script>

<svelte:head>
	<title>Hello world!</title>
</svelte:head>

<main class="main">
	<div class="main__logo">
		<LogoImage class="main__logo-image" />
		<Logo />
	</div>
	<div class="main__content">
		<div class="main__left">
			<div class="main__left-content">
				<h1 class="main__title">
					The new way of feedback sharing
				</h1>
				<p class="main__subtitle">
					Be the first to know about our beta release by leaving your email.
				</p>
				<div class="email-input">
					<input class="email-input__input" type="text" bind:value={email} placeholder="Your email address" />
					<button class="email-input__button" on:click={insertEmail} >
						<ArrowRight />
					</button>
				</div>
			</div>
		</div>
		<div class="main__right">
			<img class="main__dashboard-image" src={'images/dashboard.png'} alt="Dashboard">
		</div>
	</div>
</main>

<style>
.main {
	height: 100%;
	padding: 32px;
	background: #FBFAFF;
}

.main__logo {
	display: flex;
	justify-content: center;
	align-items: center;
	position: absolute;
	left: 80px;
	top: 64px;
}

:global(.main__logo-image) {
	margin-right: 10px;
}

.main__content {
	display: flex;
	height: 100%;
	width: 100%;
}

.main__left, .main__right {
	flex: 1;
	height: 100%;
}

.main__left {
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 0 48px;
}

.main__left-content {
	display: flex;
	flex-direction: column;
	max-width: 416px;
	width: 100%;
}

.main__title {
	font-weight: bold;
	font-size: 48px;
	line-height: 56px;
	color: #17171A;
	margin-bottom: 20px;
}

.main__subtitle {
	font-weight: normal;
	font-size: 20px;
	line-height: 28px;
	color: #787880;
	margin-bottom: 32px;
}

.email-input {
	position: relative;
	display: flex;
	flex-direction: column;
	max-width: 400px;
	width: 100%;
}
.email-input__input {
	background: rgba(255, 255, 255, 0.8);
	border: 1px solid #E1E1E6;
	padding: 16px 64px 16px 16px;
	border-radius: 10px;
	font-size: 16px;
	line-height: 24px;
	font-family: Inter;
}
.email-input__input::placeholder {
	color: #919199;
}
.email-input__button {
	border: 0;
	position: absolute;
	top: 8px;
	right: 8px;
	background: #511FDC;
	padding: 10px;
	border-radius: 10px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.main__right {
	border-radius: 16px;
	background: linear-gradient(31.46deg, #ECE6FF 0%, #F9E6FF 98.96%);
	padding-left: 64px;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.main__dashboard-image {
	width: 100%;
}

@media screen and (max-width: 420px) {
	.main__content {
		flex-direction: column;
	}
}
</style>
