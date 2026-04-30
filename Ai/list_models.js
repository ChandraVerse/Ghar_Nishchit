const apiKey = "YOUR_API_KEY_HERE" // Replace with your actual API key

async function main() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    const names = data.models.map(m => m.name);
    console.log(names.filter(n => !n.includes('embedding') && !n.includes('robotics')));
}

main().catch(console.error);
