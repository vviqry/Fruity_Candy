import { useState, useEffect } from 'react';
import { SupplyItem, DistributionItem, SyncData } from './types';
import SupplyManager from './components/SupplyManager';
import DistributionManager from './components/DistributionManager';
import SyncPanel from './components/SyncPanel';
import IframeLightbox from './components/IframeLightbox';
import { Cherry, ArrowDownLeft, ArrowUpRight, Database, MapPin, Layers, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // App state
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [distributionItems, setDistributionItems] = useState<DistributionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'supply' | 'distribution'>('supply');
  const [online, setOnline] = useState(navigator.onLine);

  // Lightbox state
  const [lightboxMapCode, setLightboxMapCode] = useState<string | null>(null);
  const [lightboxLocationName, setLightboxLocationName] = useState('');

  // Load from LocalStorage
  useEffect(() => {
    const localSupply = localStorage.getItem('pwa_logistik_supply');
    const localDistribution = localStorage.getItem('pwa_logistik_distribution');

    if (localSupply) {
      try {
        setSupplyItems(JSON.parse(localSupply));
      } catch (e) {
        console.error('Error loading supply:', e);
      }
    } else {
      // Seed initial dummy data if empty to make the app look complete and professional on first view
      const seedSupply: SupplyItem[] = [
        { id: 'sup-1', productName: 'Toples Kaca Bulat 500ml', category: '🟢', price: 12500, entryDate: '2026-07-10' },
        { id: 'sup-2', productName: 'Toples Plastik Kedap Udara 1L', category: '🔴', price: 18000, entryDate: '2026-07-11' },
        { id: 'sup-3', productName: 'Dus Packing Karton Tebal', category: '🟡', price: 4500, entryDate: '2026-07-11' },
      ];
      setSupplyItems(seedSupply);
      localStorage.setItem('pwa_logistik_supply', JSON.stringify(seedSupply));
    }

    if (localDistribution) {
      try {
        const parsed = JSON.parse(localDistribution);
        const migrated = parsed.map((item: any) => {
          if (!item.deliveries) {
            // Reconstruct deliveries array from old properties
            const deliveries = [];
            const historyDates = Array.isArray(item.historyDates) && item.historyDates.length > 0
              ? item.historyDates
              : ['2026-07-11'];
            
            historyDates.forEach((date: string, idx: number) => {
              deliveries.push({
                date,
                jarQuantity: idx === 0 ? (item.jarQuantity || 0) : 0,
                jarType: item.jarType || 'Manco Crunch',
              });
            });

            if (deliveries.length === 0) {
              deliveries.push({
                date: '2026-07-11',
                jarQuantity: item.jarQuantity || 0,
                jarType: item.jarType || 'Manco Crunch',
              });
            }

            return {
              id: item.id,
              locationName: item.locationName,
              mapEmbedCode: item.mapEmbedCode || '',
              deliveries,
            };
          }
          return item;
        });
        setDistributionItems(migrated);
        localStorage.setItem('pwa_logistik_distribution', JSON.stringify(migrated));
      } catch (e) {
        console.error('Error loading distribution:', e);
      }
    } else {
      // Seed initial dummy data if empty with standard map embeds
      const seedDistribution: DistributionItem[] = [
        {
          id: 'dist-1',
          locationName: 'Gudang Cabang Sleman',
          mapEmbedCode: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12656.326262100806!2d110.3705!3d-7.7201!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a591e1383cd81%3A0xe5433cd637ecdc33!2sSleman%2C%20Sleman%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          deliveries: [
            { date: '2026-07-11', jarQuantity: 45, jarType: 'Manco Crunch' },
            { date: '2026-07-09', jarQuantity: 20, jarType: 'Fruity Candy' }
          ],
        },
        {
          id: 'dist-2',
          locationName: 'Agen Retail Bantul',
          mapEmbedCode: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12653.250495111166!2d110.3308!3d-7.8903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a57a164bba467%3A0x4027a7649211aa0!2sBantul%2C%20Bantul%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1700000000001!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          deliveries: [
            { date: '2026-07-10', jarQuantity: 30, jarType: 'Fruity Candy' }
          ],
        },
      ];
      setDistributionItems(seedDistribution);
      localStorage.setItem('pwa_logistik_distribution', JSON.stringify(seedDistribution));
    }

    // Monitor connectivity
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state helpers
  const saveSupply = (newItems: SupplyItem[]) => {
    setSupplyItems(newItems);
    localStorage.setItem('pwa_logistik_supply', JSON.stringify(newItems));
  };

  const saveDistribution = (newItems: DistributionItem[]) => {
    setDistributionItems(newItems);
    localStorage.setItem('pwa_logistik_distribution', JSON.stringify(newItems));
  };

  // Supply operations
  const handleAddSupplyItem = (item: Omit<SupplyItem, 'id'>) => {
    const newItem: SupplyItem = {
      ...item,
      id: `sup-${Date.now()}`,
    };
    saveSupply([newItem, ...supplyItems]);
  };

  const handleDeleteSupplyItem = (id: string) => {
    saveSupply(supplyItems.filter((item) => item.id !== id));
  };

  // Distribution operations
  const handleAddDistribution = (dist: {
    locationName: string;
    jarQuantity: number;
    jarType: string;
    mapEmbedCode: string;
    entryDate: string;
  }) => {
    const existingIndex = distributionItems.findIndex(
      (item) => item.locationName.toLowerCase().trim() === dist.locationName.toLowerCase().trim()
    );

    if (existingIndex > -1) {
      // If location exists, update deliveries list. Map embed code and location name are kept permanent.
      const updatedList = [...distributionItems];
      const target = updatedList[existingIndex];
      
      const existingDeliveryIndex = target.deliveries.findIndex(d => d.date === dist.entryDate);
      let updatedDeliveries = [...target.deliveries];
      
      if (existingDeliveryIndex > -1) {
        // If there is already a delivery on this exact date, replace it or update its values
        updatedDeliveries[existingDeliveryIndex] = {
          date: dist.entryDate,
          jarQuantity: dist.jarQuantity,
          jarType: dist.jarType,
        };
      } else {
        // Otherwise prepend new delivery
        updatedDeliveries = [
          {
            date: dist.entryDate,
            jarQuantity: dist.jarQuantity,
            jarType: dist.jarType,
          },
          ...target.deliveries,
        ];
      }

      // Sort deliveries by date descending so the newest is always first
      updatedDeliveries.sort((a, b) => b.date.localeCompare(a.date));
      
      updatedList[existingIndex] = {
        ...target,
        deliveries: updatedDeliveries,
      };
      
      saveDistribution(updatedList);
    } else {
      // Create new distribution point with its first delivery record
      const newDistItem: DistributionItem = {
        id: `dist-${Date.now()}`,
        locationName: dist.locationName,
        mapEmbedCode: dist.mapEmbedCode,
        deliveries: [
          {
            date: dist.entryDate,
            jarQuantity: dist.jarQuantity,
            jarType: dist.jarType,
          }
        ],
      };
      saveDistribution([newDistItem, ...distributionItems]);
    }
  };

  const handleDeleteDistribution = (id: string) => {
    saveDistribution(distributionItems.filter((item) => item.id !== id));
  };

  const handleDeleteDelivery = (id: string, date: string) => {
    const updated = distributionItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          deliveries: item.deliveries.filter((d) => d.date !== date),
        };
      }
      return item;
    }).filter((item) => item.deliveries.length > 0);
    saveDistribution(updated);
  };

  const handleToggleDeliveryStatus = (id: string, date: string) => {
    const updated = distributionItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          deliveries: item.deliveries.map((d) => {
            if (d.date === date) {
              return {
                ...d,
                status: d.status === 'habis' ? 'tersedia' : 'habis',
              };
            }
            return d;
          }),
        };
      }
      return item;
    });
    saveDistribution(updated);
  };

  // Import operation
  const handleImportData = (data: SyncData) => {
    setSupplyItems(data.supply);
    setDistributionItems(data.distribution);
    localStorage.setItem('pwa_logistik_supply', JSON.stringify(data.supply));
    localStorage.setItem('pwa_logistik_distribution', JSON.stringify(data.distribution));
  };

  // Open Lightbox
  const handleShowMap = (embedCode: string, locationName: string) => {
    setLightboxMapCode(embedCode);
    setLightboxLocationName(locationName);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Banner / Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-500 text-white rounded-xl shadow-md shadow-pink-500/10">
              <Cherry className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight leading-tight text-base sm:text-lg">
                PWA Logistik Personal
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Supply &amp; Distribusi Manager
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Penyimpanan Lokal Aktif (100% Aman)</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 max-w-md mx-auto mb-6 shadow-xs">
          <button
            onClick={() => setActiveTab('supply')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
              activeTab === 'supply'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-supply"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Supply (Barang Masuk)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex-1 flex-items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
              activeTab === 'distribution'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-distribution"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Distribusi (Barang Keluar)</span>
          </button>
        </div>

        {/* Tab Contents with custom animations */}
        <div className="min-h-[400px]">
          {activeTab === 'supply' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SupplyManager
                items={supplyItems}
                onAddItem={handleAddSupplyItem}
                onDeleteItem={handleDeleteSupplyItem}
              />
            </motion.div>
          )}

          {activeTab === 'distribution' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DistributionManager
                items={distributionItems}
                onAddDistribution={handleAddDistribution}
                onDeleteDistribution={handleDeleteDistribution}
                onDeleteDelivery={handleDeleteDelivery}
                onToggleDeliveryStatus={handleToggleDeliveryStatus}
                onShowMap={handleShowMap}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Lightbox Modal for Google Maps */}
      {lightboxMapCode && (
        <IframeLightbox
          embedCode={lightboxMapCode}
          locationName={lightboxLocationName}
          onClose={() => setLightboxMapCode(null)}
        />
      )}
    </div>
  );
}
