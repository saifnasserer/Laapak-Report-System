const http = require('http');

async function getProduct() {
    const url = 'http://localhost:9000/store/products?handle=microsoft-surface-laptop-4&fields=*variants.calculated_price,+variants.inventory_quantity,+metadata';

    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const product = json.products[0];
                if (!product) {
                    console.log("Product not found");
                    return;
                }
                console.log("Product Title:", product.title);
                product.variants.forEach(v => {
                    console.log(`Variant ID: ${v.id}`);
                    console.log(`- Manage Inventory: ${v.manage_inventory}`);
                    console.log(`- Inventory Quantity: ${v.inventory_quantity}`);
                    console.log(`- Prices: ${JSON.stringify(v.calculated_price)}`);
                });
            } catch (e) {
                console.error("Failed to parse JSON", e);
                console.log("Raw data:", data);
            }
        });
    }).on('error', (err) => {
        console.error("Request failed", err);
    });
}

getProduct();
