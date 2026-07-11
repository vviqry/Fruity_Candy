import React, { useState } from 'react';
import { SupplyItem } from '../types';
import { Plus, Trash2, Tag, Calendar, DollarSign, Package, AlertCircle } from 'lucide-react';

interface SupplyManagerProps {
  items: SupplyItem[];
  onAddItem: (item: Omit<SupplyItem, 'id'>) => void;
  onDeleteItem: (id: string) => void;
}

export default function SupplyManager({ items, onAddItem, onDeleteItem }: SupplyManagerProps) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<'🔴' | '🟡' | '🟢'>('🟢');
  const [price, setPrice] = useState<number | ''>('');
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  // Stats calculation
  const totalItems = items.length;
  const totalPrice = items.reduce((acc, item) => acc + item.price, 0);
  const redCount = items.filter(item => item.category === '🔴').length;
  const yellowCount = items.filter(item => item.category === '🟡').length;
  const greenCount = items.filter(item => item.category === '🟢').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Nama Produk tidak boleh kosong');
      return;
    }
    if (price === '' || price <= 0) {
      setError('Harga harus berupa angka lebih besar dari 0');
      return;
    }
    if (!entryDate) {
      setError('Tanggal masuk harus diisi');
      return;
    }

    onAddItem({
      productName: productName.trim(),
      category,
      price: Number(price),
      entryDate,
    });

    // Reset Form
    setProductName('');
    setCategory('🟢');
    setPrice('');
    setError('');
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Produk</p>
            <h4 className="text-xl font-bold text-slate-800">{totalItems} Item</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Nilai Supply</p>
            <h4 className="text-xl font-bold text-slate-800">{formatIDR(totalPrice)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4 col-span-1 sm:col-span-2 lg:col-span-2">
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Breakdown Urgensi / Kategori</p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="text-lg">🔴</span>
                <span className="text-xs font-semibold text-slate-600">{redCount} <span className="font-normal text-slate-400">Utama</span></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg">🟡</span>
                <span className="text-xs font-semibold text-slate-600">{yellowCount} <span className="font-normal text-slate-400">Pendukung</span></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg">🟢</span>
                <span className="text-xs font-semibold text-slate-600">{greenCount} <span className="font-normal text-slate-400">Umum</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-blue-500" />
            <span>Input Barang Masuk (Supply)</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="productName" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Nama Produk
              </label>
              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Toples Kaca Premium, Beras Premium"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Kategori Status
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as '🔴' | '🟡' | '🟢')}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none"
                  >
                    <option value="🔴">🔴 Utama (Penting)</option>
                    <option value="🟡">🟡 Pendukung (Sedang)</option>
                    <option value="🟢">🟢 Umum (Biasa)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <Tag className="w-4 h-4 mr-2" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Harga Satuan (Rp)
                </label>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 15000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="entryDate" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Tanggal Masuk
              </label>
              <div className="relative">
                <input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              id="btn-add-supply"
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/15 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan ke database</span>
            </button>
          </form>
        </div>

        {/* Table Column */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            Tabel Supply (Barang Masuk)
          </h3>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 space-y-2">
                <Package className="w-10 h-10 text-slate-300" />
                <p className="text-sm">Belum ada barang masuk yang dicatat.</p>
                <p className="text-xs text-slate-400">Silakan isi form di samping untuk mulai menyimpan data.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm" id="table-supply-list">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Nama Produk</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Kategori</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Harga</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Tanggal Masuk</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-medium text-slate-800">{item.productName}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 border border-slate-100">
                          <span>{item.category}</span>
                          <span>
                            {item.category === '🔴' ? 'Utama' : item.category === '🟡' ? 'Pendukung' : 'Umum'}
                          </span>
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{formatIDR(item.price)}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{item.entryDate}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus pencatatan supply untuk "${item.productName}"?`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                          title="Hapus"
                          id={`btn-delete-supply-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
