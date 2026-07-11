import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IframeLightboxProps {
  embedCode: string;
  locationName: string;
  onClose: () => void;
}

export default function IframeLightbox({ embedCode, locationName, onClose }: IframeLightboxProps) {
  // Extract src or just inject the raw iframe code safely.
  // We'll wrap it in a container that forces responsiveness.
  const cleanEmbed = () => {
    if (!embedCode.includes('<iframe')) {
      // If they just pasted a raw URL instead of iframe code, we can turn it into an iframe
      const url = embedCode.trim().startsWith('http') ? embedCode.trim() : `https://www.google.com/maps/embed?pb=${embedCode.trim()}`;
      return `<iframe src="${url}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }
    
    // If it's standard iframe, make sure we force 100% width and height so it scales inside our responsive modal
    let modified = embedCode;
    modified = modified.replace(/width="[0-9%]+"/, 'width="100%"');
    modified = modified.replace(/height="[0-9%]+"/, 'height="100%"');
    return modified;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        />

        {/* Content Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Peta Lokasi</h3>
              <p className="text-xs text-slate-500">{locationName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
              aria-label="Tutup Peta"
              id="btn-close-map-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Iframe Body */}
          <div className="relative flex-1 bg-slate-100 min-h-[300px] md:min-h-[450px] aspect-video">
            <div
              className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: cleanEmbed() }}
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end text-xs text-slate-400">
            Pastikan koneksi internet aktif untuk memuat Google Maps
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
