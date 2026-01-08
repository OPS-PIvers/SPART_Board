Implementation Plan: Global Class Roster System (Renamed to Groups in UI)ContextWe are implementing a global "Class Roster" system that persists across all dashboards for a user. Note: In the UI, this is displayed as "Groups" or "Group Rosters".Global Data: Rosters are stored in users/{uid}/rosters in Firestore.Dock Integration: A new "Groups" icon in the Dock opens a quick Popout Menu for switching active classes.Groups Widget: A full-featured widget for editing rosters, featuring Smart Paste (auto-splitting First/Last names).Step 1: Type DefinitionsWe need to define the Roster data shape and update the Widget definitions.types.tsAction: Append/Update these types.// ... existing types ...

// --- ROSTER SYSTEM TYPES ---

export interface Student {
id: string;
firstName: string;
lastName: string;
}

export interface ClassRoster {
id: string;
name: string;
students: Student[];
createdAt: number;
}

// --- WIDGET DATA TYPES ---

// Add 'classes' to WidgetType
export type WidgetType =
// ... existing types
| 'work-symbols'
| 'classes'; // <--- NEW

// Define ClassesWidgetData
export interface ClassesWidgetData {
id: string;
type: 'classes';
x: number;
y: number;
w: number;
h: number;
minimized?: boolean;
}

// Add to WidgetData union
export type WidgetData =
// ... existing widgets
| WorkSymbolsWidgetData
| ClassesWidgetData; // <--- NEW
Step 2: Context UpdatesWe must upgrade DashboardContext to subscribe to the global rosters collection.context/DashboardContextValue.tsAction: Update interface.import { Dashboard, WidgetData, WidgetType, ClassRoster } from '../types';

export interface DashboardContextValue {
// ... existing props ...

// --- ROSTER SYSTEM ---
rosters: ClassRoster[];
activeRosterId: string | null;
addRoster: (name: string) => Promise<string>;
updateRoster: (rosterId: string, updates: Partial<ClassRoster>) => Promise<void>;
deleteRoster: (rosterId: string) => Promise<void>;
setActiveRoster: (rosterId: string | null) => void;
}
context/DashboardContext.tsxAction: Add the second Firestore subscription.// ... imports
import { ClassRoster } from '../types';

// ... inside DashboardProvider component ...

// --- ROSTER STATE ---
const [rosters, setRosters] = useState<ClassRoster[]>([]);
const [activeRosterId, setActiveRosterIdState] = useState<string | null>(() => {
return localStorage.getItem('spart_active_roster_id');
});

// --- EXISTING DASHBOARD EFFECT ...

// --- NEW ROSTER EFFECT ---
useEffect(() => {
if (!user) {
setRosters([]);
return;
}
const rostersRef = collection(db, 'users', user.uid, 'rosters');
// Simple client-side sort for now to avoid index creation requirements during dev
const unsubscribe = onSnapshot(rostersRef, (snapshot) => {
const loaded: ClassRoster[] = [];
snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() } as ClassRoster));
loaded.sort((a, b) => a.name.localeCompare(b.name));
setRosters(loaded);
});
return () => unsubscribe();
}, [user]);

// --- ROSTER ACTIONS ---
const addRoster = useCallback(async (name: string) => {
if (!user) throw new Error("No user");
const newRoster = { name, students: [], createdAt: Date.now() };
const ref = await addDoc(collection(db, 'users', user.uid, 'rosters'), newRoster);
return ref.id;
}, [user]);

const updateRoster = useCallback(async (id: string, updates: Partial<ClassRoster>) => {
if (!user) return;
await updateDoc(doc(db, 'users', user.uid, 'rosters', id), updates);
}, [user]);

const deleteRoster = useCallback(async (id: string) => {
if (!user) return;
await deleteDoc(doc(db, 'users', user.uid, 'rosters', id));
if (activeRosterId === id) setActiveRoster(null);
}, [user, activeRosterId]);

const setActiveRoster = useCallback((id: string | null) => {
setActiveRosterIdState(id);
if (id) localStorage.setItem('spart_active_roster_id', id);
else localStorage.removeItem('spart_active_roster_id');
}, []);

// ... Update value object ...
Step 3: The Full Widget (Editor)This is the main window for editing classes with Smart Paste.components/widgets/ClassesWidget.tsxAction: Create New File.import React, { useState, useEffect } from 'react';
import { ClassesWidgetData, Student } from '../../types';
import DraggableWindow from '../common/DraggableWindow';
import { useDashboard } from '../../context/useDashboard';
import { Users, Plus, Trash2, Save, Star, Edit2 } from 'lucide-react';

interface Props {
data: ClassesWidgetData;
}

const ClassesWidget: React.FC<Props> = ({ data }) => {
const {
updateWidget, removeWidget,
rosters, addRoster, updateRoster, deleteRoster,
activeRosterId, setActiveRoster
} = useDashboard();

const [view, setView] = useState<'list' | 'edit'>('list');
const [editingId, setEditingId] = useState<string | null>(null);

// Edit State
const [name, setName] = useState('');
const [firsts, setFirsts] = useState('');
const [lasts, setLasts] = useState('');

// Load data when editingId changes
useEffect(() => {
if (editingId) {
const r = rosters.find(x => x.id === editingId);
if (r) {
setName(r.name);
setFirsts(r.students.map(s => s.firstName).join('\n'));
setLasts(r.students.map(s => s.lastName).join('\n'));
}
}
}, [editingId, rosters]);

const handleSave = async () => {
if (!editingId) {
// Create new
if(!name.trim()) return;
const id = await addRoster(name, students);
setView('list');
return;
}
const fList = firsts.split('\n');
const lList = lasts.split('\n');
const students: Student[] = fList.map((f, i) => {
const first = f.trim();
const last = lList[i] ? lList[i].trim() : '';
if (!first && !last) return null;
return { id: crypto.randomUUID(), firstName: first, lastName: last };
}).filter((s): s is Student => s !== null);

    await updateRoster(editingId, { name, students });
    setView('list');
    setEditingId(null);

};

const handleSmartPaste = (e: React.ClipboardEvent) => {
e.preventDefault();
const text = e.clipboardData.getData('text');
const rows = text.split(/\r\n|\r|\n/);
const newF: string[] = [];
const newL: string[] = [];

    rows.forEach(row => {
        const parts = row.trim().split(' ');
        if(parts.length > 0 && parts[0]) {
            newF.push(parts[0]);
            newL.push(parts.slice(1).join(' '));
        }
    });

    const prefix = firsts ? '\n' : '';
    setFirsts(firsts + prefix + newF.join('\n'));
    setLasts(lasts + (lasts ? '\n' : '') + newL.join('\n'));

};

return (
<DraggableWindow
id={data.id}
title="Class Rosters"
icon={<Users size={18} />}
onClose={() => removeWidget(data.id)}
onMinimize={() => updateWidget(data.id, { minimized: !data.minimized })}
isMinimized={data.minimized}
x={data.x} y={data.y} w={data.w} h={data.h} >

<div className="flex flex-col h-full bg-slate-50 p-4 overflow-hidden">

        {view === 'list' && (
           <div className="flex flex-col h-full">
              <button
                onClick={() => { setEditingId(null); setName(''); setFirsts(''); setLasts(''); setView('edit'); }}
                className="mb-4 bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Plus size={18} /> Create New Class
              </button>
              <div className="flex-1 overflow-y-auto space-y-2">
                 {rosters.map(r => (
                    <div key={r.id} className={`p-3 border rounded-lg bg-white flex justify-between items-center ${activeRosterId === r.id ? 'ring-2 ring-blue-400' : ''}`}>
                       <div className="flex items-center gap-3">
                          <button onClick={() => setActiveRoster(activeRosterId === r.id ? null : r.id)} className={activeRosterId === r.id ? 'text-yellow-500' : 'text-slate-300'}>
                             <Star fill={activeRosterId === r.id ? 'currentColor' : 'none'} size={20} />
                          </button>
                          <div>
                             <div className="font-bold">{r.name}</div>
                             <div className="text-xs text-slate-500">{r.students.length} Students</div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingId(r.id); setView('edit'); }} className="p-2 hover:bg-slate-100 rounded"><Edit2 size={16} /></button>
                          <button onClick={() => deleteRoster(r.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'edit' && (
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                 <button onClick={() => setView('list')} className="text-xs text-slate-500 hover:text-blue-600">&larr; Back</button>
                 <div className="flex gap-2">
                    <input className="font-bold border-b bg-transparent" placeholder="Class Name" value={name} onChange={e => setName(e.target.value)} />
                    <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded flex gap-1 items-center text-xs"><Save size={14}/> Save</button>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                 <div className="flex flex-col h-full">
                    <label className="text-xs font-semibold mb-1">First Name (Smart Paste)</label>
                    <textarea
                        className="flex-1 border p-2 rounded resize-none text-sm font-mono"
                        value={firsts}
                        onChange={e => setFirsts(e.target.value)}
                        onPaste={handleSmartPaste}
                        placeholder="Paste list here..."
                    />
                 </div>
                 <div className="flex flex-col h-full">
                    <label className="text-xs font-semibold mb-1">Last Name</label>
                    <textarea
                        className="flex-1 border p-2 rounded resize-none text-sm font-mono"
                        value={lasts}
                        onChange={e => setLasts(e.target.value)}
                    />
                 </div>
              </div>
           </div>
        )}

      </div>
    </DraggableWindow>

);
};
export default ClassesWidget;
Step 4: The Popout MenuThis component is the lightweight menu launched from the Dock.components/layout/ClassRosterMenu.tsxAction: Create New File.import React, { useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Star, Plus, Trash2, Edit2 } from 'lucide-react';

interface Props {
onClose: () => void;
onOpenFullEditor: () => void;
}

const ClassRosterMenu: React.FC<Props> = ({ onClose, onOpenFullEditor }) => {
const { rosters, activeRosterId, setActiveRoster } = useDashboard();
const menuRef = useRef<HTMLDivElement>(null);

// Close if clicked outside
useEffect(() => {
const handleClickOutside = (event: MouseEvent) => {
if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
onClose();
}
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, [onClose]);

return (

<div 
      ref={menuRef}
      className="absolute bottom-20 left-20 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
    >
<div className="p-3 bg-slate-50 border-b flex justify-between items-center">
<span className="font-bold text-xs text-slate-500 uppercase">Quick Select</span>
<span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{rosters.length}</span>
</div>

      <div className="max-h-64 overflow-y-auto p-1">
        {rosters.length === 0 && <div className="p-4 text-center text-slate-400 text-xs">No classes found.</div>}

        {rosters.map(r => (
          <div key={r.id} className={`flex items-center justify-between p-2 rounded hover:bg-slate-50 group ${activeRosterId === r.id ? 'bg-blue-50' : ''}`}>
             <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setActiveRoster(activeRosterId === r.id ? null : r.id)}>
                <Star size={16} className={activeRosterId === r.id ? "text-blue-500 fill-blue-500" : "text-slate-300 group-hover:text-blue-300"} />
                <span className={`text-sm ${activeRosterId === r.id ? 'font-semibold text-blue-700' : 'text-slate-700'}`}>{r.name}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t bg-slate-50">
        <button
          onClick={onOpenFullEditor}
          className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus size={14} /> Open Full Editor
        </button>
      </div>

      {/* Little arrow at the bottom */}
      <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-slate-50 border-r border-b border-slate-200 transform rotate-45"></div>
    </div>

);
};
export default ClassRosterMenu;
Step 5: Dock IntegrationWe need to add the "Classes" icon to the Dock.components/layout/Dock.tsxAction: Import the menu and widget logic.// ... imports
import { Users } from 'lucide-react';
import ClassRosterMenu from './ClassRosterMenu';

// ... Inside Dock Component ...

const { addWidget } = useDashboard(); // Ensure addWidget is destructured
const [showRosterMenu, setShowRosterMenu] = useState(false);

// Function to open the Full Widget
const openClassEditor = () => {
addWidget('classes');
setShowRosterMenu(false);
};

return (
<>
{/_ --- POPUP MENUS --- _/}
{showRosterMenu && (
<ClassRosterMenu
onClose={() => setShowRosterMenu(false)}
onOpenFullEditor={openClassEditor}
/>
)}

      <div className="fixed bottom-6 left-1/2 ...">
         {/* ... Existing Dock Items ... */}

         {/* ... NEW ROSTER ICON ... */}
         <button
           onClick={() => setShowRosterMenu(!showRosterMenu)}
           className={`p-3 rounded-xl transition-all hover:scale-110 active:scale-95 bg-white/50 backdrop-blur-md shadow-sm hover:bg-white relative group`}
         >
           <Users className="text-slate-700" />
           <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
             Classes
           </span>
         </button>

         {/* ... Separator ... */}
         <div className="w-px h-8 bg-slate-300 mx-2 opacity-50"></div>

         {/* ... Rest of Dock ... */}
      </div>
    </>

);
Step 6: RegistrationRegister the widget so it renders correctly.components/widgets/WidgetRenderer.tsx// ... imports
import ClassesWidget from './ClassesWidget';

// ... inside switch
case 'classes': return <ClassesWidget data={data as ClassesWidgetData} />;
config/widgetGradeLevels.tsAdd it to the tools list if you want it discoverable in the "Add Widget" menu as well.{
type: 'classes',
title: 'Class Rosters',
description: 'Manage student lists',
icon: Users,
defaultSize: { w: 600, h: 500 },
gradeLevels: ['k', '1', '2', '3', '4', '5']
}
