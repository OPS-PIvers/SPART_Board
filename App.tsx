
import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Sidebar } from './components/layout/Sidebar';
import { Dock } from './components/layout/Dock';
import { WidgetRenderer } from './components/widgets/WidgetRenderer';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDashboard();
  return (
    <div className="fixed top-6 right-6 z-[10000] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto cursor-pointer animate-in slide-in-from-right duration-300 ${
            toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
            'bg-white/90 border-slate-200 text-slate-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardView: React.FC = () => {
  const { activeDashboard } = useDashboard();

  if (!activeDashboard) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse">Loading Classroom Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen w-screen overflow-hidden transition-all duration-1000 ${activeDashboard.background}`}>
      {/* Background Overlay for Depth */}
      <div className="absolute inset-0 bg-black/5" />
      
      {/* Dynamic Widget Surface */}
      <div className="relative w-full h-full">
        {activeDashboard.widgets.map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>

      <Sidebar />
      <Dock />
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardView />
    </DashboardProvider>
  );
};

export default App;
