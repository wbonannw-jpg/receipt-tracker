const fs = require('fs');
const imageFile = "C:\\Users\\mako\\.gemini\\antigravity\\brain\\eef69bfd-eb57-46d2-8ed9-2a406c6986c9\\test_receipt_1772014971454.png";

async function run() {
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(imageFile)], { type: "image/png" });
    formData.append("file", blob, "test.png");

    const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
