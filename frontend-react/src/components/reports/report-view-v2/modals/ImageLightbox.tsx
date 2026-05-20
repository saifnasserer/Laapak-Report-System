import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, Plus, Minus, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ImageLightboxProps {
    selectedImage: string | null;
    onClose: () => void;
}

export function ImageLightbox({ selectedImage, onClose }: ImageLightboxProps) {
    if (!selectedImage) return null;

    return (
        <motion.div
            key="image-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
            <motion.button
                className="fixed top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[140]"
                onClick={onClose}
            >
                <XCircle size={24} />
            </motion.button>

            <TransformWrapper minScale={1} centerOnInit={true} initialScale={1}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[140] flex items-center gap-2 p-2 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
                            <button onClick={() => zoomIn?.()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><Plus size={20} /></button>
                            <button onClick={() => zoomOut?.()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><Minus size={20} /></button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button onClick={() => resetTransform?.()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><RotateCcw size={18} /></button>
                        </div>

                        <TransformComponent wrapperClass="!w-screen !h-screen cursor-move" contentClass="w-full h-full flex items-center justify-center">
                            <img src={selectedImage} alt="Inspection Detail" className="max-w-[90%] max-h-[90%] object-contain rounded-2xl shadow-2xl pointer-events-none" />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </motion.div>
    );
}
export default ImageLightbox;
