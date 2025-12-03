import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, PieChart, DollarSign, Utensils, ShoppingBag, ArrowLeft, Save, Pencil, Download, Upload } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'add'
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('7'); // '7', '30', 'custom'
  const [editingEntry, setEditingEntry] = useState(null); // State to hold the entry being edited
  
  // New state for Date Range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('expense_data');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      // Dummy data for demonstration
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
          others: []
        }
      ]);
    }
  }, []);

  // Save to local storage whenever entries change
  useEffect(() => {
    localStorage.setItem('expense_data', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = (entryToSave) => {
    if (editingEntry) {
      // Update existing entry
      setEntries(prev => prev.map(item => item.id === entryToSave.id ? entryToSave : item));
      setEditingEntry(null);
    } else {
      // Add new entry
      setEntries(prev => [entryToSave, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
    setView('dashboard');
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setView('add');
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setView('dashboard');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "expense_tracker_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedEntries = JSON.parse(e.target.result);
        if (Array.isArray(importedEntries)) {
          if (window.confirm("This will replace your current data with the imported file. Are you sure?")) {
             setEntries(importedEntries);
             alert("Data imported successfully!");
          }
        } else {
          alert("Invalid file format. Please upload a valid backup file.");
        }
      } catch (error) {
        alert("Error reading file. Please ensure it is a valid backup file.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    event.target.value = ''; 
  };

  const getFilteredEntries = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return entries.filter(entry => {
      // Logic for Custom Date Range
      if (filter === 'custom') {
        if (!startDate && !endDate) return true; // Show all if no dates selected
        const entryDate = entry.date;
        const start = startDate || '0000-01-01'; // Default to beginning of time
        const end = endDate || '9999-12-31';     // Default to end of time
        return entryDate >= start && entryDate <= end;
      }

      // Logic for 7 and 30 days
      const entryDate = new Date(entry.date);
      const diffTime = Math.abs(now - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= parseInt(filter);
    });
  };

  const calculateTotals = () => {
    const filtered = getFilteredEntries();
    let foodTotal = 0;
    let otherTotal = 0;

    filtered.forEach(entry => {
      foodTotal += Number(entry.food) || 0;
      if (entry.others && entry.others.length > 0) {
        entry.others.forEach(o => otherTotal += Number(o.amount) || 0);
      }
    });

    return { foodTotal, otherTotal, grandTotal: foodTotal + otherTotal };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DollarSign size={24} /> ExpenseTracker
          </h1>
          {view === 'dashboard' && (
            <button 
              onClick={() => { setEditingEntry(null); setView('add'); }}
              className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 transition shadow-sm"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pb-20">
        {view === 'dashboard' ? (
          <Dashboard 
            totals={totals} 
            filter={filter} 
            setFilter={setFilter} 
            entries={getFilteredEntries()}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
            onExport={handleExport}
            onImport={handleImport}
          />
        ) : (
          <AddEntryForm 
            onSave={handleSaveEntry} 
            onCancel={handleCancel} 
            initialData={editingEntry}
          />
        )}
      </div>
    </div>
  );
}

function Dashboard({ totals, filter, setFilter, entries, startDate, setStartDate, endDate, setEndDate, onDelete, onEdit, onExport, onImport }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
        {['7', '30', 'custom'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              filter === f 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f === 'custom' ? 'Date Range' : `Last ${f} Days`}
          </button>
        ))}
      </div>

      {/* Date Range Inputs (Only visible if 'custom' is selected) */}
      {filter === 'custom' && (
        <div className="flex gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 font-medium mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 font-medium mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="bg-orange-100 p-2 rounded-full mb-2 text-orange-600">
            <Utensils size={20} />
          </div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Food</span>
          <span className="text-xl font-bold text-slate-800">${totals.foodTotal.toLocaleString()}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="bg-purple-100 p-2 rounded-full mb-2 text-purple-600">
            <ShoppingBag size={20} />
          </div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Others</span>
          <span className="text-xl font-bold text-slate-800">${totals.otherTotal.toLocaleString()}</span>
        </div>

        <div className="col-span-2 bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-md text-white flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Spent</p>
            <p className="text-3xl font-bold">${totals.grandTotal.toLocaleString()}</p>
          </div>
          <PieChart className="text-blue-200 opacity-50" size={40} />
        </div>
      </div>
      
      {/* Data Management Buttons */}
      <div className="flex gap-3 justify-end">
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
        >
          <Download size={16} /> Export Data
        </button>
        <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition cursor-pointer">
          <Upload size={16} /> Import Data
          <input 
            type="file" 
            accept=".json" // Accepts JSON files, but technically handles any text file with valid JSON content
            className="hidden" 
            onChange={onImport}
          />
        </label>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="text-slate-700 font-bold mb-3 text-lg">History</h3>
        {entries.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            <Calendar size={40} className="mx-auto mb-2 opacity-50" />
            <p>No records found for this period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const otherSum = entry.others.reduce((acc, curr) => acc + Number(curr.amount), 0);
              const total = Number(entry.food) + otherSum;
              
              return (
                <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span className="flex items-center gap-1"><Utensils size={10} /> ${entry.food}</span>
                        {otherSum > 0 && <span className="flex items-center gap-1 border-l pl-2 border-slate-300"><ShoppingBag size={10} /> ${otherSum}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-blue-600 text-lg">${total}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => onEdit(entry)} 
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => onDelete(entry.id)} 
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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

    const entry = {
      id: initialData ? initialData.id : Date.now(), // Keep ID if editing, else generate new
      date,
      food: parseFloat(food) || 0,
      others
    };
    onSave(entry);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onCancel} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Entry' : 'Add New Entry'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Date Selection */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-600 mb-2">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Food Expense */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <Utensils size={16} className="text-orange-500" /> Food Expense
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400">$</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
            />
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-purple-500" /> Other Expenses
          </label>
          
          {/* List of added items */}
          {others.length > 0 && (
            <div className="mb-4 space-y-2">
              {others.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm">
                  <span className="font-medium text-slate-700">{item.detail}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">${item.amount}</span>
                    <button onClick={() => removeOtherItem(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new item input */}
          <div className="flex gap-2 mb-2">
            <input 
              type="text" 
              placeholder="Detail (e.g. Taxi)" 
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              className="flex-[2] p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input 
              type="number" 
              placeholder="Amt" 
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button 
            onClick={addOtherItem}
            className="w-full py-2 text-sm text-blue-600 font-medium bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            + Add Item
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
      >
        <Save size={20} /> {initialData ? 'Update Entry' : 'Save Entry'}
      </button>
    </div>
  );
}