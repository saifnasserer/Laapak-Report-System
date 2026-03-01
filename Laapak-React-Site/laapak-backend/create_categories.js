const axios = require('axios');

async function createCategories() {
    const adminEmail = 'admin@laapak.com';
    const adminPassword = 'password'; // Assuming default or common password
    const baseUrl = 'http://localhost:9000';

    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseUrl}/auth/user/emailpass`, {
            email: adminEmail,
            password: adminPassword,
        });

        const token = loginRes.data.token;
        console.log('Logged in successfully.');

        const categories = ['HP', 'Dell', 'Lenovo'];

        for (const category of categories) {
            console.log(`Creating category: ${category}...`);
            try {
                await axios.post(
                    `${baseUrl}/admin/product-categories`,
                    {
                        name: category,
                        handle: category.toLowerCase(),
                        is_active: true,
                        is_internal: false,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log(`Category ${category} created successfully.`);
            } catch (err) {
                if (err.response && err.response.status === 409) {
                    console.log(`Category ${category} already exists.`);
                } else {
                    console.error(`Error creating category ${category}:`, err.response?.data || err.message);
                }
            }
        }
    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
    }
}

createCategories();
