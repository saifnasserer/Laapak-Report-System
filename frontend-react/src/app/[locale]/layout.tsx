import '@/app/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Montserrat, Noto_Sans_Arabic } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-english',
    weight: ['400', '500', '600', '700'],
});

const notoArabic = Noto_Sans_Arabic({
    subsets: ['arabic'],
    variable: '--font-arabic',
    weight: ['400', '500', '600', '700'],
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <body className={`${montserrat.variable} ${notoArabic.variable} antialiased`} suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
