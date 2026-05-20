import React, { useState } from 'react';
import { Video, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComponentNameArabic } from '../utils';

interface ExternalExaminationSectionProps {
    report: any;
    onImageClick: (url: string) => void;
}

export function ExternalExaminationSection({ report, onImageClick }: ExternalExaminationSectionProps) {
    let media: any[] = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { console.error(e); }

    const images = media.filter((m: any) => m.type === 'image' || !m.type);
    const video = media.find((m: any) => m.type === 'video' || m.type === 'youtube');
    const [selectedMedia, setSelectedMedia] = useState<any>(video || images[0] || null);

    return (
        <div className="space-y-6">
            <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-sm border border-black/[0.03] relative group">
                {selectedMedia ? (
                    selectedMedia.type === 'video' || selectedMedia.type === 'youtube' ? (
                        selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be') ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${(selectedMedia.url.match(/(?:v=|youtu\.be\/)([^&]+)/) || [])[1]}`}
                                className="w-full h-full border-0"
                                allowFullScreen
                                title="External Examination Video"
                            />
                        ) : (
                            <video src={selectedMedia.url} className="w-full h-full object-contain" controls autoPlay muted playsInline />
                        )
                    ) : (
                        <img src={selectedMedia.url} alt="Selected" className="w-full h-full object-contain bg-black/90 cursor-zoom-in" onClick={() => onImageClick(selectedMedia.url)} />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                        <ImageIcon size={64} />
                        <p className="mt-4 font-bold">No Media Selected</p>
                    </div>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar" dir="rtl">
                {video && (
                    <button onClick={() => setSelectedMedia(video)} className={cn("flex-shrink-0 w-16 h-16 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 transition-all relative group snap-start", selectedMedia === video ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition-colors"><Video className="text-white" size={20} /></div>
                        <div className="w-full h-full bg-secondary" />
                    </button>
                )}
                {images.map((img: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedMedia(img)} className={cn("flex-shrink-0 w-16 h-16 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 transition-all snap-start", selectedMedia === img ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <img src={img.url} alt={getComponentNameArabic(img.component || img.name)} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}
export default ExternalExaminationSection;
