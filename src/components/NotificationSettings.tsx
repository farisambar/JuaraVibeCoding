import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, BellOff, HelpCircle, Shield, Play, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

export default function NotificationSettings() {
  const { permission, requestPermission, sendNotification } = useNotifications();
  const [showHelp, setShowHelp] = useState(false);

  // Bahasa Indonesia translation mapping
  const statusLabel = {
    granted: "Izin Diberikan",
    denied: "Izin Ditolak",
    default: "Belum Diatur",
    unsupported: "Browser Tidak Mendukung",
    sandboxed: "Dibatasi Iframe (Sandbox)",
  }[permission] || "Unknown";

  const handleTest = () => {
    sendNotification(
      "⏰ Tes Notifikasi Sukses!",
      "Notifikasi telah berhasil dikirim ke perangkat kamu. Sistem Pengingat kini aktif!",
      "success"
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>Notifikasi Browser</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Terima pengingat real-time untuk tenggat waktu deadline dan agenda terjadwal.
          </p>
        </div>
        
        {/* Status indicator badge */}
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
          permission === 'granted'
            ? 'bg-green-500/10 border-green-500/15 text-green-600 dark:text-green-400'
            : permission === 'denied'
            ? 'bg-red-500/10 border-red-500/15 text-red-600 dark:text-red-400'
            : 'bg-muted border-border text-muted-foreground'
        }`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {permission !== 'granted' && permission !== 'unsupported' && (
          <Button 
            onClick={requestPermission} 
            size="sm" 
            className="text-xs font-bold gap-1.5 h-8 px-3"
          >
            <Shield className="w-3.5 h-3.5" />
            Berikan Izin Notifikasi
          </Button>
        )}

        <Button 
          onClick={handleTest} 
          variant="outline" 
          size="sm" 
          className="text-xs font-semibold gap-1.5 h-8 px-3"
        >
          <Play className="w-3 mx-0.5 text-primary" />
          Kirim Notifikasi Tes
        </Button>

        <Button
          onClick={() => setShowHelp(!showHelp)}
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground font-medium h-8 p-2"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Sandbox Info & Advice */}
      {permission === 'sandboxed' && (
        <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 text-[11px] text-orange-600 dark:text-orange-400 leading-relaxed font-medium">
          ⚠️ <strong>Iframe Sandbox Terdeteksi:</strong> Sandbox AI Studio membatasi prompt izin notifikasi browser secara langsung. Untuk pengalaman terbaik dengan notifikasi browser asli, <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="underline font-bold inline-flex items-center gap-0.5">buka aplikasi di tab baru <ExternalLink className="w-3 h-3 inline" /></a>. Tenang, in-app toast notification kami akan tetap muncul!
        </div>
      )}

      {showHelp && (
        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-2 leading-relaxed animate-in slide-in-from-top-1">
          <p className="font-bold text-foreground">💡 Cara kerja Notifikasi Browser:</p>
          <ul className="list-disc pl-4 space-y-1 p-0.5">
            <li><strong>Pengingat Otomatis</strong>: Aplikasi memantau agenda harianmu secara berkala di latar belakang.</li>
            <li><strong>In-App Fallback</strong>: Jika browser menolak atau tidak mendukung notifikasi push, Time menggunakan sistem banner melayang (toast) internal yang cantik sehingga kamu tidak akan pernah melewatkan deadline.</li>
            <li><strong>Aktivasi Mandiri</strong>: Klik tombol <em>Kirim Notifikasi Tes</em> di atas kapan saja untuk mengetes.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
