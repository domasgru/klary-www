<script>
	import { createClient } from '@supabase/supabase-js'
	import Header from '$/routes/index/Header.svelte'

	const supabaseUrl = "https://iklqhrrxiyjfmaiskeym.supabase.co";
	const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNzMwMzA5MiwiZXhwIjoxOTMyODc5MDkyfQ.JSXPBUiRbISJjIHiKfJK-0gsPWdRlZyZhuyHD2ClHEU'
	const supabase = createClient(supabaseUrl, supabaseKey)

	const insertEmail = async () => {
		await supabase
			.from('emails')
			.insert([
				{ email: 'dominykas@gmail.com' },
			], {returning: 'minimal'})
	}
</script>

<svelte:head>
	<title>Hello world!</title>
</svelte:head>

<main>
	<Header />
</main>

<style>
	
</style>
