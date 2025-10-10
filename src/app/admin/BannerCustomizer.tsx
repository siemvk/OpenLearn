"use client"

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSystemMessage, setSystemMessage, clearSystemMessage } from '@/serverActions/systemMessage';
import { useSysMsgStore } from '@/store/sysmsg/SysMsgProvider';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Button1 from '@/components/button/Button1';
import { Input } from '@/components/ui/input';
import { Save, Trash } from 'lucide-react';


const BannerCustomizer: React.FC = () => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#2563eb');

  // Define color options for the select
  const colorOptions = [
    { value: '#2563eb', label: 'Blauw', swatch: 'bg-[#2563eb]' },
    { value: '#16a34a', label: 'Groen', swatch: 'bg-[#16a34a]' },
    { value: '#eab308', label: 'Geel', swatch: 'bg-[#eab308]' },
    { value: '#dc2626', label: 'Rood', swatch: 'bg-[#dc2626]' },
    { value: '#6b7280', label: 'Grijs', swatch: 'bg-[#6b7280]' },
    { value: '#0e7490', label: 'Cyaan', swatch: 'bg-[#0e7490]' },
    { value: '#f59e42', label: 'Oranje', swatch: 'bg-[#f59e42]' },
    { value: '#a21caf', label: 'Paars', swatch: 'bg-[#a21caf]' },
  ];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const config = await getSystemMessage();
        setText(config.message);
        setColor(config.color);
      } catch {
        toast.error('Kon bannerconfiguratie niet laden');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const store = useSysMsgStore();
  const handleSave = async () => {
    try {
      await setSystemMessage({ message: text, color });
      // update zustand store so banner updates immediately
      store.setState({ message: text, color });
      toast.success('Banner opgeslagen!');
    } catch (e) {
      toast.error('Fout bij opslaan van banner: ' + (e as Error).message);
    }
  };

  const handleClear = async () => {
    try {
      await clearSystemMessage();
      store.setState({ message: '', color });
      setText('');
      toast.success('Banner verwijderd');
    } catch {
      toast.error('Fout bij verwijderen van banner');
    }
  };

  return (
    <div className="p-4 border rounded bg-neutral-800 mb-4 mr-4">
      <h2 className="font-bold mb-2">Outage/System Message Banner</h2>
      <p className="text-sm text-red-600 mb-3">⚠️ Deze banner is zichtbaar voor alle gebruikers. Gebruik dit alleen voor belangrijke meldingen, zoals storingen of onderhoud.</p>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-2">
            <label className="block mb-1">Tekst</label>
            <Input value={text} onChange={e => setText(e.target.value)} placeholder='Bijv: "Wij zitten de PolarLearn servers te upgraden, daarom is het momenteel wat langzamer!"' />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Kleur</label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className={`inline-block w-4 h-4 rounded-full mr-2 align-middle`} style={{ background: opt.value }} />
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button1 text="Opslaan" onClick={handleSave} icon={<Save />} />
            <Button1 text="Verwijderen" onClick={handleClear} icon={<Trash className='text-red-500' />} />
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCustomizer;
