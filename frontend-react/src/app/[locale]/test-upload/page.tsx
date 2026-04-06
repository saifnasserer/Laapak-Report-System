"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2, Video, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TestVideoUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            console.log("Starting Catbox upload via proxy for:", file.name, "Size:", file.size);
            
            // Use backend proxy to bypass CORS
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch("/api/upload/catbox", {
                method: "POST",
                headers: {
                    ...(token ? { 'x-auth-token': token } : {})
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data.success && data.url) {
                setResult(data.url);
                console.log("Catbox upload successful:", data.url);
            } else {
                throw new Error(data.error || data.details || "Upload failed");
            }
        } catch (err: any) {
            console.error("Upload error details:", err);
            setError(err.message || "An unexpected error occurred during the upload.");
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            // Could add a toast here
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <Video className="text-primary h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800">Catbox API Testing</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Test anonymous video uploads to the Catbox.moe API endpoint.</p>
                </div>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-700">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            File Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {/* File Input Area */}
                        <div className="space-y-4">
                            <div 
                                className={cn(
                                    "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer",
                                    file ? "border-primary/20 bg-primary/[0.02]" : "border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                                )}
                                onClick={() => document.getElementById('catbox-upload')?.click()}
                            >
                                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
                                    <Video className={cn("h-8 w-8 transition-colors", file ? "text-primary" : "text-slate-400")} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">{file ? file.name : "Select a video file"}</p>
                                    <p className="text-xs text-slate-500 mt-1">{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Click to browse or drag and drop"}</p>
                                </div>
                                <input 
                                    id="catbox-upload"
                                    type="file" 
                                    className="hidden"
                                    onChange={handleFileChange} 
                                    accept="video/*"
                                />
                            </div>
                        </div>

                        {/* Action Component */}
                        <Button 
                            onClick={handleUpload} 
                            disabled={!file || uploading} 
                            className="w-full h-14 rounded-full text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    Uploading to Catbox...
                                </>
                            ) : (
                                "Start Upload"
                            )}
                        </Button>

                        {/* Error State */}
                        {error && (
                            <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-3xl text-sm font-bold animate-in bounce-in duration-300">
                                ⚠️ Error: {error}
                            </div>
                        )}

                        {/* Result Area */}
                        {result && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-[2.5rem]">
                                    <div className="bg-white rounded-[2.4rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                                                    <div className="h-3 w-3 bg-green-500 rounded-full" />
                                                </div>
                                                <h3 className="font-black text-slate-800">Direct Link Generated</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 hover:bg-slate-100" onClick={() => window.open(result, '_blank')}>
                                                    <ExternalLink size={18} className="text-slate-600" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 hover:bg-slate-100" onClick={copyToClipboard}>
                                                    <Copy size={18} className="text-slate-600" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm break-all text-primary font-bold">
                                            {result}
                                        </div>
                                        
                                        <div className="pt-2">
                                            <video controls className="w-full rounded-2xl shadow-lg bg-black aspect-video" key={result}>
                                                <source src={result} type={file?.type} />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="bg-white/50 backdrop-blur-sm border border-white p-8 rounded-[2rem] shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Technical API Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-medium text-slate-600">
                        <div className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                            <p>Anonymous uploads are permanent and public.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                            <p>File limit is 200MB per request.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
                            <p>Direct multipart/form-data POST used.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
