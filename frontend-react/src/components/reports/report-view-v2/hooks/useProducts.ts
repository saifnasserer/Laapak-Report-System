import { useState, useEffect } from 'react';
import axios from 'axios';
import { ACCESSORIES_CATEGORY_ID, MEDUSA_BASE_URL, MEDUSA_PUBLISHABLE_KEY } from '../constants';

export function useProducts(activeStep: number) {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            if (products.length === 0) {
                try {
                    setIsLoadingProducts(true);
                    console.log('Fetching accessories from Medusa...');
                    const response = await axios.get(`${MEDUSA_BASE_URL}/store/products`, {
                        params: {
                            category_id: [ACCESSORIES_CATEGORY_ID],
                            fields: 'id,title,handle,description,thumbnail,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,images.url',
                            limit: 50
                        },
                        headers: {
                            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY
                        }
                    });

                    if (!response.data || !response.data.products) {
                        console.error('Invalid response from Medusa:', response.data);
                        setProducts([]);
                        return;
                    }

                    const mappedProducts = response.data.products.map((p: any) => {
                        const firstVariant = p.variants?.[0];
                        const firstPrice = firstVariant?.prices?.[0];
                        const priceAmount = firstPrice ? (firstPrice.amount ?? 0) : 0;

                        return {
                            id: p.id || p.handle || `product-${Math.random().toString(36).substr(2, 9)}`,
                            name: p.title,
                            price: priceAmount,
                            images: p.images?.map((img: any) => ({ src: img.url })) || [],
                            description: p.description
                        };
                    });

                    console.log(`Successfully fetched ${mappedProducts.length} accessories`);
                    setProducts(mappedProducts);
                } catch (err: any) {
                    console.error('Failed to fetch products from Medusa:', err.message, err.response?.data);
                } finally {
                    setIsLoadingProducts(false);
                }
            }
        };

        fetchProducts();
    }, [activeStep, products.length]);

    return {
        products,
        isLoadingProducts
    };
}
