export interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    images?: Array<{ src: string }>;
    description?: string;
    quantity?: number;
    regular_price?: number;
    amount?: number;
}

export interface AgentData {
    cpu?: {
        name?: string;
        cores?: number;
        temperature?: number;
    };
    storage?: {
        devices?: Array<{
            health?: number;
        }>;
    };
    battery?: {
        health?: number;
    };
    display?: {
        width?: number;
        height?: number;
    };
    [key: string]: any;
}
