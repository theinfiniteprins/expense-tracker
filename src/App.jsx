import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Trash2, Calendar as CalendarIcon, PieChart as PieChartIcon, 
  IndianRupee, Utensils, ShoppingBag, ArrowLeft, Save, Pencil, 
  Copy, Upload, X, ChevronLeft, ChevronRight, List, Wallet,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// --- Utility Components ---

const GlassCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl ${className}`}
  >
    {children}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'add'
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('7'); // '7', '30', 'custom'
  const [editingEntry, setEditingEntry] = useState(null);
  
  // Date Range State
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
      // Dummy data
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
            { id: 2, detail: 'Notebook', amount: 40 }
          ]
        },
        {
          id: Date.now() - 1000,
          date: yesterday.toISOString().split('T')[0],
          food: 300,
          others: [
            { id: 3, detail: 'Uber to work', amount: 100 }
          ]
        }
      ]);
    }
  }, []);

  // Save data
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

  // Optimized Handlers with useCallback
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

  // Import/Export logic
  const handleCopyData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      alert("Data copied to clipboard!");
    }).catch(() => {
      // Fallback
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-900 font-sans selection:bg-purple-200">
      {/* Sticky Header with Glassmorphism */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md shadow-lg text-white p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <IndianRupee size={20} />
            </div>
            <span>ExpenseTracker</span>
          </h1>
          {view === 'dashboard' && (
            <button 
              onClick={() => { setEditingEntry(null); setView('add'); }}
              className="bg-white text-purple-600 p-2 rounded-full hover:bg-purple-50 transition shadow-lg active:scale-95"
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
              allEntries={entries} // Pass full list for calendar markers
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Prepare Chart Data
  const chartData = useMemo(() => {
    const data = [
      { name: 'Food', value: totals.foodTotal, color: '#F59E0B' } // Amber-500
    ];
    
    const otherMap = {};
    entries.forEach(e => {
      e.others?.forEach(o => {
        const key = o.detail.trim();
        otherMap[key] = (otherMap[key] || 0) + Number(o.amount);
      });
    });

    // Sort others by value and take top 4, group rest as "Misc"
    const sortedOthers = Object.entries(otherMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#6366F1']; // Purple, Pink, Blue, Emerald, Indigo
    
    sortedOthers.forEach((item, index) => {
      data.push({ 
        ...item, 
        color: colors[index % colors.length] 
      });
    });

    return data.filter(d => d.value > 0);
  }, [totals, entries]);

  // Calculate breakdown for Others Modal
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Date Filter Tabs */}
      <GlassCard className="p-1 flex gap-1">
        {['7', '30', 'custom'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            {f === 'custom' ? 'Date Range' : `Last ${f} Days`}
          </button>
        ))}
      </GlassCard>

      {/* Custom Date Inputs */}
      <AnimatePresence>
        {filter === 'custom' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-3 flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 ml-1">Start</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm p-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 ml-1">End</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm p-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Section with Chart */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stats Cards */}
        <div className="space-y-3">
           <GlassCard className="p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1 text-orange-600">
                <Utensils size={16} />
                <span className="text-xs font-bold uppercase">Food</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">₹{totals.foodTotal.toLocaleString()}</span>
           </GlassCard>
           
           <GlassCard 
             onClick={() => setShowBreakdown(true)}
             className="p-4 flex flex-col justify-center cursor-pointer hover:bg-white/40 transition active:scale-95"
           >
              <div className="flex items-center gap-2 mb-1 text-purple-600">
                <ShoppingBag size={16} />
                <span className="text-xs font-bold uppercase">Others</span>
              </div>
              <span className="text-2xl font-bold text-slate-800">₹{totals.otherTotal.toLocaleString()}</span>
           </GlassCard>
        </div>

        {/* Chart Card */}
        <GlassCard className="p-2 flex flex-col items-center justify-center relative overflow-hidden">
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-widest">Total</span>
                    <span className="text-sm font-bold text-slate-700">₹{totals.grandTotal > 1000 ? (totals.grandTotal/1000).toFixed(1) + 'k' : totals.grandTotal}</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 h-full">
              <PieChartIcon size={40} className="mb-2 opacity-50" />
              <span className="text-xs">No Data</span>
            </div>
          )}
          {/* Decorative gradient blob */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-200 rounded-full blur-2xl opacity-50 z-0"></div>
        </GlassCard>
      </div>

      {/* View Toggle & Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-slate-800 font-bold text-lg">Transactions</h3>
        <div className="flex gap-2">
           {/* View Toggle */}
           <div className="bg-white/50 p-1 rounded-xl flex border border-white/40">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                <CalendarIcon size={18} />
              </button>
           </div>
           
           {/* Data Actions Dropdown/Group */}
           <div className="bg-white/50 p-1 rounded-xl flex border border-white/40">
             <button onClick={onCopy} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition">
               <Copy size={18} />
             </button>
             <label className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer">
               <Upload size={18} />
               <input type="file" accept=".json" className="hidden" onChange={onImport} />
             </label>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white/50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <ShoppingBag size={20} className="text-purple-600" />
                  Others Breakdown
                </h3>
                <button 
                  onClick={() => setShowBreakdown(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto p-4 flex-1">
                {othersBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No other expenses found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {othersBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/50 p-3 rounded-2xl border border-slate-100">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-900">₹{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-white/50 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Others</span>
                <span className="text-xl font-bold text-purple-600">₹{totals.otherTotal.toLocaleString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- List View Components ---

// OPTIMIZED: Memoized to prevent unnecessary re-renders when other UI elements update
const SwipeableEntry = React.memo(({ entry, onEdit, onDelete }) => {
  const otherSum = entry.others.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const total = Number(entry.food) + otherSum;
  
  // Drag logic constraints
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0, 100], ["#EF4444", "#ffffff", "#3B82F6"]);
  
  const handleDragEnd = (event, info) => {
    if (info.offset.x < -80) { // Swiped Left -> Delete
      onDelete(entry.id);
    } else if (info.offset.x > 80) { // Swiped Right -> Edit
      onEdit(entry);
    }
  };

  return (
    <div className="relative mb-3 group">
      {/* Background Actions Layer */}
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center px-6 overflow-hidden">
        <div className="flex items-center gap-2 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Pencil size={18} /> Edit
        </div>
        <div className="flex items-center gap-2 text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           Delete <Trash2 size={18} />
        </div>
      </div>
      
      {/* Foreground Content */}
      <motion.div
        style={{ x, background }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        // PERFORMANCE FIX: Removed backdrop-blur-sm from list items. 
        // Having blur on many scrollable items is the #1 cause of lag on mobile/web.
        className="relative bg-white/80 shadow-sm border border-white/50 p-4 rounded-2xl cursor-grab active:cursor-grabbing z-10"
        whileTap={{ scale: 0.98 }}
        // Performance hint for browser
        layout
      >
        <div className="flex justify-between items-start pointer-events-none">
          <div>
            <div className="font-bold text-slate-800 text-lg">
              {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex gap-3">
              <span className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                <Utensils size={10} /> ₹{entry.food}
              </span>
              {otherSum > 0 && (
                <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                  <ShoppingBag size={10} /> ₹{otherSum}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-xl">
              ₹{total}
            </span>
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

  // PERFORMANCE FIX: Use a Set for O(1) lookup instead of iterating array for every day cell
  const entryDates = useMemo(() => new Set(entries.map(e => e.date)), [entries]);
  const hasEntry = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entryDates.has(dateStr);
  };

  const renderDays = () => {
    const days = [];
    // Empty slots for prev month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const isEntry = hasEntry(d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <button 
          key={d} 
          onClick={() => onDateSelect(dateStr)}
          className={`h-10 w-full flex flex-col items-center justify-center relative rounded-lg transition-colors
            ${isToday ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}
          `}
        >
          <span className="text-sm">{d}</span>
          {isEntry && (
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-0.5"></div>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <GlassCard className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
        <span className="font-bold text-lg text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </GlassCard>
  );
}

// --- Empty State Component ---

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
    <div className="bg-white p-6 rounded-full shadow-lg mb-6 relative">
      <Wallet size={48} className="text-purple-500" />
      <div className="absolute -bottom-1 -right-1 bg-green-100 p-1.5 rounded-full border border-white">
        <CheckCircle2 size={20} className="text-green-600" />
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">Wallet is safe!</h3>
    <p className="text-slate-500 max-w-[200px]">
      No expenses found for this period. Try changing filters or add a new spend.
    </p>
  </div>
);

// --- Form Component (Updated Styles) ---

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
        <button onClick={onCancel} className="text-slate-500 hover:bg-white p-2 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Entry' : 'Add New Entry'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <GlassCard className="p-4">
          <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </GlassCard>

        {/* Food */}
        <GlassCard className="p-4">
          <label className="block text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Utensils size={14} className="text-orange-500" /> Food Expense
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-400">₹</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              className="w-full pl-8 p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl font-bold text-slate-800"
            />
          </div>
        </GlassCard>

        {/* Others */}
        <GlassCard className="p-4">
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
                  className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                >
                  <span className="font-medium text-slate-700">{item.detail}</span>
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
            <input 
              type="text" 
              placeholder="Detail (e.g. Taxi)" 
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              className="flex-[2] p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <input 
              type="number" 
              placeholder="Amt" 
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
              className="flex-1 p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <button 
            onClick={addOtherItem}
            className="w-full py-3 text-sm text-purple-600 font-bold bg-purple-50 rounded-xl hover:bg-purple-100 transition border border-purple-100"
          >
            + Add Item
          </button>
        </GlassCard>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
      >
        <Save size={20} /> {initialData ? 'Update Entry' : 'Save Entry'}
      </button>
    </motion.div>
  );
}