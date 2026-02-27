const data = {
    date: "2023-11-15",
    totalAmount: 1100,
    items: [
        { name: "ポテトチップス", price: 160, category: "食費" },
        { name: "お茶", price: 130, category: "食費" },
        { name: "洗剤", price: 500, category: "日用品" },
        { name: "切手", price: 310, category: "通信費" } // Unplanned category test
    ]
};

async function run() {
    const response = await fetch("http://localhost:3000/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
