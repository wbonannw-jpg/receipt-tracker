async function test() {
    try {
        console.log("Testing API with targetStore=イトーヨーカドー...");
        // Shinjuku station coordinates
        const lat = 35.6895;
        const lng = 139.6917;
        const radius = 10000;

        const res = await fetch(`http://localhost:3000/api/places?lat=${lat}&lng=${lng}&radius=${radius}&type=supermarket&targetStore=${encodeURIComponent('イトーヨーカドー')}`);

        if (!res.ok) {
            console.error("HTTP Error:", res.status, await res.text());
            return;
        }

        const data = await res.json();

        if (data.results) {
            console.log(`Found ${data.results.length} total results.`);

            // Check if any Ito Yokado was found
            const targetStores = data.results.filter(p => p.name && p.name.includes('イトーヨーカドー'));
            console.log(`\nFound ${targetStores.length} stores matching 'イトーヨーカドー':`);
            targetStores.forEach(s => console.log(`- ${s.name} (${s.address})`));

        } else {
            console.log("No results returned or error:", data);
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
