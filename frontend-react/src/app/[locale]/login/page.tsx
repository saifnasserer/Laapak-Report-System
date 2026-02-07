'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

import { use } from 'react';

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('auth');
    const ct = useTranslations('common');

    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [credential, setCredential] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(identifier, credential);
        } catch (err) {
            setError(t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background patterns could be added here */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[100px]" />
            </div>

            <main className="w-full max-w-[420px] relative z-10 space-y-8 animate-in fade-in duration-700">
                <div className="text-center space-y-4">
                    <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                        {/* Dramatic Glow Effect */}
                        <div className="absolute inset-4 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
                        <div className="absolute inset-8 bg-primary/10 rounded-full blur-[20px]" />

                        <Image
                            src="/logo.png"
                            alt="Laapak"
                            width={160}
                            height={160}
                            className="object-contain relative z-10 filter drop-shadow-[0_0_30px_rgba(var(--primary),0.2)]"
                        />
                    </div>
                    <p className="text-secondary font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            // label={t('identifier_label')}
                            placeholder={t('identifier_placeholder')}
                            icon={<User size={20} />}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                        />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-primary transition-colors z-10"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                // label={t('credential_label')}
                                placeholder={t('credential_placeholder')}
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                disabled={isLoading}
                                className="pl-12"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium p-3 rounded-xl animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        {t('submit')}
                    </Button>
                </form>

                <footer className="text-center pt-8">
                    <p className="text-sm text-secondary/60">
                        © {new Date().getFullYear()} Laapak
                    </p>
                </footer>
            </main>
        </div>
    );
}
