import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Trash2, Calendar as CalendarIcon, PieChart as PieChartIcon, 
  IndianRupee, Utensils, ShoppingBag, ArrowLeft, Save, Pencil, 
  Copy, Upload, X, ChevronLeft, ChevronRight, List, Wallet,
  CheckCircle2, Car, Coffee, Home, Zap, Smartphone, Gift, Music, 
  Briefcase, TrendingUp, Filter
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// --- Utility Components ---

// Switched to "Soft UI" (Solid BG + Soft Shadow) for better performance than Glassmorphism
const SoftCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-slate-100 shadow-xl shadow-indigo-100/50 rounded-3xl ${className}`}
  >
    {children}
  </div>
);

const getCategoryIcon = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('uber') || lower.includes('ola') || lower.includes('taxi') || lower.includes('fuel') || lower.includes('bus')) return <Car size={14} />;
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('cafe')) return <Coffee size={14} />;
  if (lower.includes('rent') || lower.includes('home') || lower.includes('house')) return <Home size={14} />;
  if (lower.includes('bill') || lower.includes('electric') || lower.includes('light')) return <Zap size={14} />;
  if (lower.includes('phone') || lower.includes('recharge') || lower.includes('net')) return <Smartphone size={14} />;
  if (lower.includes('gift') || lower.includes('donation')) return <Gift size={14} />;
  if (lower.includes('movie') || lower.includes('sub')) return <Music size={14} />;
  if (lower.includes('work') || lower.includes('office')) return <Briefcase size={14} />;
  return <ShoppingBag size={14} />;
};

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('7'); 
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState('');

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('expense_data');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      setEntries([
        {
          id: Date.now(),
          date: today.toISOString().split('T')[0],
          food: 250,
          others: [
            { id: 1, detail: 'Uber to work', amount: 150 },
            { id: 2, detail: 'Coffee', amount: 40 }
          ]
        },
        {
          id: Date.now() - 1000,
          date: yesterday.toISOString().split('T')[0],
          food: 300,
          others: [
            { id: 3, detail: 'Netflix Sub', amount: 199 }
          ]
        }
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('expense_data', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = (entryToSave) => {
    if (editingEntry) {
      setEntries(prev => prev.map(item => item.id === entryToSave.id ? entryToSave : item));
      setEditingEntry(null);
    } else {
      setEntries(prev => [entryToSave, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    setView('dashboard');
  };

  const handleDeleteEntry = useCallback((id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  }, []);

  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setView('add');
  }, []);

  const handleCancel = () => {
    setEditingEntry(null);
    setView('dashboard');
  };

  const handleCopyData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      alert("Data copied to clipboard!");
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = dataStr;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Data copied to clipboard!");
    });
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          if (window.confirm("Overwrite current data?")) setEntries(imported);
        } else alert("Invalid file.");
      } catch (err) { alert("Error reading file."); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Filters
  const getFilteredEntries = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return entries.filter(entry => {
      if (filter === 'custom') {
        if (!startDate && !endDate) return true;
        const entryDate = entry.date;
        const start = startDate || '0000-01-01';
        const end = endDate || '9999-12-31';
        return entryDate >= start && entryDate <= end;
      }
      const entryDate = new Date(entry.date);
      const diffTime = Math.abs(now - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= parseInt(filter);
    });
  }, [entries, filter, startDate, endDate]);

  const totals = useMemo(() => {
    let foodTotal = 0;
    let otherTotal = 0;
    getFilteredEntries.forEach(entry => {
      foodTotal += Number(entry.food) || 0;
      if (entry.others) entry.others.forEach(o => otherTotal += Number(o.amount) || 0);
    });
    return { foodTotal, otherTotal, grandTotal: foodTotal + otherTotal };
  }, [getFilteredEntries]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-200">
      {/* Sticky Header - Simplified for performance */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-1.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <IndianRupee size={18} strokeWidth={3} />
            </div>
            <span>ExpenseTracker</span>
          </h1>
          {view === 'dashboard' && (
            <button 
              onClick={() => { setEditingEntry(null); setView('add'); }}
              className="bg-slate-900 text-white p-2.5 rounded-full hover:bg-slate-800 transition shadow-lg active:scale-95"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <Dashboard 
              key="dashboard"
              totals={totals} 
              filter={filter} 
              setFilter={setFilter} 
              entries={getFilteredEntries}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onDelete={handleDeleteEntry}
              onEdit={handleEditEntry}
              onCopy={handleCopyData}
              onImport={handleImport}
              allEntries={entries} 
            />
          ) : (
            <AddEntryForm 
              key="add-form"
              onSave={handleSaveEntry} 
              onCancel={handleCancel} 
              initialData={editingEntry}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Dashboard Sub-Components ---

function Dashboard({ totals, filter, setFilter, entries, startDate, setStartDate, endDate, setEndDate, onDelete, onEdit, onCopy, onImport, allEntries }) {
  const [viewMode, setViewMode] = useState('list'); 
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const chartData = useMemo(() => {
    const data = [
      { name: 'Food', value: totals.foodTotal, color: '#F97316' } // Orange-500
    ];
    
    const otherMap = {};
    entries.forEach(e => {
      e.others?.forEach(o => {
        const key = o.detail.trim();
        otherMap[key] = (otherMap[key] || 0) + Number(o.amount);
      });
    });

    const sortedOthers = Object.entries(otherMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#6366F1'];
    
    sortedOthers.forEach((item, index) => {
      data.push({ 
        ...item, 
        color: colors[index % colors.length] 
      });
    });

    return data.filter(d => d.value > 0);
  }, [totals, entries]);

  const othersBreakdown = useMemo(() => {
    const map = {};
    entries.forEach(entry => {
      if (entry.others && entry.others.length > 0) {
        entry.others.forEach(item => {
          const detail = item.detail.trim();
          const key = detail.toLowerCase();
          if (!map[key]) {
            map[key] = { name: detail, total: 0 };
          }
          map[key].total += Number(item.amount);
        });
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [entries]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Date Filter Pills */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1 overflow-x-auto">
        {['7', '30', 'custom'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 min-w-[80px] py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${
              filter === f 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f === 'custom' ? 'Range' : `${f} Days`}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {filter === 'custom' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <SoftCard className="p-3 flex gap-2 mb-2 bg-slate-50">
              <div className="flex-1">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </SoftCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
           {/* Food Card */}
           <SoftCard className="p-4 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                <Utensils size={40} className="text-orange-500" />
              </div>
              <span className="text-xs font-bold uppercase text-slate-400 mb-1">Food</span>
              <span className="text-2xl font-bold text-slate-800">₹{totals.foodTotal.toLocaleString()}</span>
           </SoftCard>
           
           {/* Others Card */}
           <SoftCard 
             onClick={() => setShowBreakdown(true)}
             className="p-4 flex flex-col justify-center relative overflow-hidden group cursor-pointer active:scale-95 transition"
           >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                <ShoppingBag size={40} className="text-purple-500" />
              </div>
              <span className="text-xs font-bold uppercase text-slate-400 mb-1">Others</span>
              <span className="text-2xl font-bold text-slate-800">₹{totals.otherTotal.toLocaleString()}</span>
              <div className="absolute bottom-2 right-2 bg-purple-100 text-purple-600 p-1 rounded-full">
                <ChevronRight size={12} />
              </div>
           </SoftCard>
        </div>

        {/* Chart Card */}
        <SoftCard className="p-2 flex flex-col items-center justify-center relative">
          {chartData.length > 0 ? (
            <div className="w-full h-[140px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                 <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total</span>
                 <span className="text-sm font-black text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                   ₹{totals.grandTotal > 1000 ? (totals.grandTotal/1000).toFixed(1) + 'k' : totals.grandTotal}
                 </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 h-full">
              <PieChartIcon size={40} className="mb-2 opacity-50" />
              <span className="text-xs">No Data</span>
            </div>
          )}
        </SoftCard>
      </div>

      {/* View Toggle & Actions */}
      <div className="flex justify-between items-end pb-2 border-b border-slate-100">
        <div>
           <h3 className="text-slate-800 font-bold text-xl">Transactions</h3>
           <p className="text-xs text-slate-400 font-medium">Swipe cards to edit or delete</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-100 p-1 rounded-lg flex">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                <CalendarIcon size={16} />
              </button>
           </div>
           
           <div className="bg-slate-100 p-1 rounded-lg flex">
             <button onClick={onCopy} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition">
               <Copy size={16} />
             </button>
             <label className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition cursor-pointer">
               <Upload size={16} />
               <input type="file" accept=".json" className="hidden" onChange={onImport} />
             </label>
           </div>
        </div>
      </div>

      <div className="min-h-[300px]">
        {viewMode === 'list' ? (
          entries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3 pb-20">
              {entries.map((entry) => (
                <SwipeableEntry 
                  key={entry.id} 
                  entry={entry} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
              ))}
            </div>
          )
        ) : (
          <CalendarView 
            entries={allEntries} 
            onDateSelect={(date) => {
              setFilter('custom');
              setStartDate(date);
              setEndDate(date);
              setViewMode('list');
            }} 
          />
        )}
      </div>

      {/* Others Breakdown Modal */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <ShoppingBag size={20} className="text-purple-600" />
                  Others Breakdown
                </h3>
                <button onClick={() => setShowBreakdown(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-4 flex-1">
                {othersBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No other expenses found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {othersBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl shadow-sm text-purple-600">
                            {getCategoryIcon(item.name)}
                          </div>
                          <span className="font-semibold text-slate-700 capitalize">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center pb-8 sm:pb-5">
                <span className="text-sm font-semibold text-slate-500">Total Others</span>
                <span className="text-2xl font-black text-purple-600">₹{totals.otherTotal.toLocaleString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- List View Components ---

const SwipeableEntry = React.memo(({ entry, onEdit, onDelete }) => {
  const otherSum = entry.others.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const total = Number(entry.food) + otherSum;
  
  // Indicator color based on spending amount
  const indicatorColor = total > 2000 ? 'bg-red-500' : total > 1000 ? 'bg-orange-500' : 'bg-emerald-500';

  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0, 100], ["#EF4444", "#ffffff", "#3B82F6"]);
  
  const handleDragEnd = (event, info) => {
    if (info.offset.x < -80) onDelete(entry.id);
    else if (info.offset.x > 80) onEdit(entry);
  };

  return (
    <div className="relative mb-3 group">
      <div className="absolute inset-0 rounded-3xl flex justify-between items-center px-6 overflow-hidden">
        <div className="flex items-center gap-2 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Pencil size={18} /> Edit
        </div>
        <div className="flex items-center gap-2 text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           Delete <Trash2 size={18} />
        </div>
      </div>
      
      <motion.div
        style={{ x, background }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        // Updated to Soft Card style - No Blur, Solid BG, Soft Shadow
        className="relative bg-white shadow-lg shadow-slate-200/50 p-4 rounded-3xl cursor-grab active:cursor-grabbing z-10 border border-slate-50 overflow-hidden"
        whileTap={{ scale: 0.98 }}
        layout
      >
        {/* Color Indicator Strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${indicatorColor}`}></div>

        <div className="flex justify-between items-start pointer-events-none pl-2">
          <div>
            <div className="font-bold text-slate-800 text-lg">
              {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' })}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
               {/* Food Chip */}
               <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg">
                  <Utensils size={12} className="text-orange-500" />
                  <span className="text-xs font-bold text-orange-700">₹{entry.food}</span>
               </div>
               
               {/* Others Chips */}
               {entry.others.map((o, i) => (
                 <div key={i} className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg">
                    <span className="text-purple-500">{getCategoryIcon(o.detail)}</span>
                    <span className="text-xs font-bold text-purple-700">₹{o.amount}</span>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end justify-center h-full">
            <span className="block font-black text-slate-800 text-lg">
              ₹{total}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// --- Calendar Component ---

function CalendarView({ entries, onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const entryDates = useMemo(() => new Set(entries.map(e => e.date)), [entries]);
  const hasEntry = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entryDates.has(dateStr);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isEntry = hasEntry(d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <button 
          key={d} 
          onClick={() => onDateSelect(dateStr)}
          className={`h-10 w-full flex flex-col items-center justify-center relative rounded-xl transition-all
            ${isToday ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}
          `}
        >
          <span className="text-sm font-medium">{d}</span>
          {isEntry && !isToday && (
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-0.5"></div>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <SoftCard className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
        <span className="font-bold text-lg text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><ChevronRight size={20}/></button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </SoftCard>
  );
}

// --- Empty State Component ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
    <div className="bg-white p-6 rounded-full shadow-lg shadow-purple-100 mb-6 relative">
      <Wallet size={48} className="text-purple-500" />
      <div className="absolute -bottom-1 -right-1 bg-green-100 p-1.5 rounded-full border-4 border-slate-50">
        <CheckCircle2 size={20} className="text-green-600" />
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">Wallet is safe!</h3>
    <p className="text-slate-500 max-w-[200px]">
      No expenses found for this period. Try changing filters or add a new spend.
    </p>
  </div>
);

// --- Form Component ---

function AddEntryForm({ onSave, onCancel, initialData }) {
  const [date, setDate] = useState(initialData ? initialData.date : new Date().toISOString().split('T')[0]);
  const [food, setFood] = useState(initialData ? initialData.food : '');
  const [others, setOthers] = useState(initialData ? initialData.others : []); 
  const [otherDetail, setOtherDetail] = useState('');
  const [otherAmount, setOtherAmount] = useState('');

  const addOtherItem = () => {
    if (!otherDetail || !otherAmount) return;
    setOthers([...others, { id: Date.now(), detail: otherDetail, amount: parseFloat(otherAmount) }]);
    setOtherDetail('');
    setOtherAmount('');
  };

  const removeOtherItem = (id) => {
    setOthers(others.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (!food && others.length === 0) {
      alert("Please enter at least a food amount or one other expense.");
      return;
    }
    onSave({
      id: initialData ? initialData.id : Date.now(),
      date,
      food: parseFloat(food) || 0,
      others
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onCancel} className="bg-white text-slate-500 hover:text-slate-800 p-2 rounded-full shadow-sm border border-slate-100 transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Entry' : 'Add New Entry'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <SoftCard className="p-4">
          <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
          />
        </SoftCard>

        {/* Food */}
        <SoftCard className="p-4">
          <label className="block text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Utensils size={14} className="text-orange-500" /> Food Expense
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-400 font-bold">₹</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              className="w-full pl-8 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl font-bold text-slate-800"
            />
          </div>
        </SoftCard>

        {/* Others */}
        <SoftCard className="p-4">
          <label className="block text-xs uppercase font-bold text-slate-400 mb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-purple-500" /> Other Expenses
          </label>
          
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {others.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-slate-400">{getCategoryIcon(item.detail)}</div>
                    <span className="font-medium text-slate-700">{item.detail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">₹{item.amount}</span>
                    <button onClick={() => removeOtherItem(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-[2] relative">
               <input 
                type="text" 
                placeholder="Detail (e.g. Taxi)" 
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                className="w-full p-3 pl-9 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <div className="absolute left-3 top-3.5 text-slate-400">
                {otherDetail ? getCategoryIcon(otherDetail) : <ShoppingBag size={14}/>}
              </div>
            </div>
            <input 
              type="number" 
              placeholder="Amt" 
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
              className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
            />
          </div>
          <button 
            onClick={addOtherItem}
            className="w-full py-3 text-sm text-blue-600 font-bold bg-blue-50 rounded-xl hover:bg-blue-100 transition border border-blue-100"
          >
            + Add Item
          </button>
        </SoftCard>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-300 hover:shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
      >
        <Save size={20} /> {initialData ? 'Update Entry' : 'Save Entry'}
      </button>
    </motion.div>
  );
}