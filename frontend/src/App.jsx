import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Play, Clock, Server, Plus, Activity, CheckCircle, AlertCircle, Terminal, PieChart } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const App = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    taskName: '',
    priority: 'Low',
    duration: 3000,
    payload: '{\n  "email": "user@example.com",\n  "type": "report"\n}'
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch jobs
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000); // Poll for updates
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/jobs`, formData);
      setFormData({ ...formData, taskName: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert("Error creating job: " + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id) => {
    try {
      setJobs(jobs.map(j => j.id === id ? { ...j, status: 'running' } : j));
      await axios.post(`${API_URL}/run-job/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 selection:bg-purple-500 selection:text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Automation Engine
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <Server size={16} /> Dotix Internal Scheduler
            </p>
          </div>
          <div className="text-right">
             <div className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full animate-pulse border border-emerald-400/20">
               SYSTEM ONLINE
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Chart & Form */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* NEW: Status Ring Chart */}
            <StatusChart jobs={jobs} />

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Plus size={20} className="text-purple-400" /> New Job
              </h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Task Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.taskName}
                    onChange={e => setFormData({...formData, taskName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder:text-slate-600"
                    placeholder="e.g. Daily Report Sync"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Duration (ms)</label>
                    <input 
                      type="number" 
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Payload</label>
                  <textarea 
                    rows="3"
                    value={formData.payload}
                    onChange={e => setFormData({...formData, payload: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-300"
                  ></textarea>
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-purple-900/20 active:scale-95 flex justify-center items-center gap-2"
                >
                  {loading ? 'Processing...' : 'Create Task'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Job List & Terminal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[400px]">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity size={20} className="text-blue-400" /> Queue Manager
                </h2>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{jobs.length} Total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Task Details</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                          <PieChart size={32} className="opacity-20" />
                          No active jobs found. Create one to start.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4 font-mono text-slate-500 text-xs">#{job.id}</td>
                          <td className="p-4">
                            <div className="font-medium text-slate-200">{job.taskName}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px] font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                {job.payload}
                            </div>
                          </td>
                          <td className="p-4">
                            <PriorityBadge priority={job.priority} />
                          </td>
                          <td className="p-4">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRun(job.id)}
                              disabled={job.status === 'running'}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all
                                ${job.status === 'running' 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                  : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20'}
                              `}
                            >
                              {job.status === 'running' ? <Clock size={12} className="animate-spin" /> : <Play size={12} />}
                              {job.status === 'running' ? 'Running' : 'Run'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simulated Live Terminal */}
            <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-48 overflow-y-auto shadow-inner custom-scrollbar">
              <div className="flex items-center gap-2 text-slate-500 mb-3 border-b border-slate-900 pb-2 sticky top-0 bg-black">
                <Terminal size={14} /> 
                <span className="uppercase tracking-wider font-bold">System Logs</span>
              </div>
              <div className="space-y-1.5">
                {jobs.slice(0, 5).map((job, i) => (
                  <div key={i} className="opacity-90 flex gap-2">
                   <span className="text-slate-600">[{new Date(job.updatedAt).toLocaleTimeString()}]</span>
                   <span>
                    {job.status === 'completed' && <span className="text-emerald-500">✔ Webhook 200 OK &bull; Job #{job.id}</span>}
                    {job.status === 'running' && <span className="text-amber-500">⟳ Executing logic for Job #{job.id}...</span>}
                    {job.status === 'pending' && <span className="text-slate-400">➜ Queued Job #{job.id}</span>}
                    {job.status === 'failed' && <span className="text-rose-500">✖ Critical Error in Job #{job.id}</span>}
                   </span>
                  </div>
                ))}
                <div className="text-purple-500 animate-pulse mt-2">_ waiting for events...</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTS ---

// New Ring Chart Component
const StatusChart = ({ jobs }) => {
  const stats = useMemo(() => {
    const total = jobs.length;
    const counts = {
      completed: jobs.filter(j => j.status === 'completed').length,
      running: jobs.filter(j => j.status === 'running').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length,
    };
    return { counts, total };
  }, [jobs]);

  // Determine Emote based on "Most Critical" active status
  let centerEmote = "💤"; // Sleep if empty
  let statusText = "Idle";
  let statusColor = "text-slate-500";

  if (stats.total > 0) {
    if (stats.counts.failed > 0) { centerEmote = "💀"; statusText = "Errors"; statusColor = "text-rose-500"; }
    else if (stats.counts.running > 0) { centerEmote = "🚀"; statusText = "Active"; statusColor = "text-amber-400"; }
    else if (stats.counts.pending > 0) { centerEmote = "⏳"; statusText = "Queued"; statusColor = "text-slate-400"; }
    else if (stats.counts.completed === stats.total) { centerEmote = "✨"; statusText = "All Done"; statusColor = "text-emerald-400"; }
  }

  // SVG Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const data = [
    { type: 'completed', count: stats.counts.completed, color: '#10b981' }, // Emerald
    { type: 'running', count: stats.counts.running, color: '#f59e0b' },   // Amber
    { type: 'failed', count: stats.counts.failed, color: '#f43f5e' },     // Rose
    { type: 'pending', count: stats.counts.pending, color: '#334155' },   // Slate
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-xl backdrop-blur-sm">
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="12" fill="none" />
                
                {/* Data Segments */}
                {stats.total > 0 && data.map((d, i) => {
                    const strokeDasharray = `${(d.count / stats.total) * circumference} ${circumference}`;
                    const strokeDashoffset = -offset;
                    offset += (d.count / stats.total) * circumference;
                    
                    if (d.count === 0) return null;

                    return (
                        <circle
                            key={i}
                            cx="50" cy="50" r={radius}
                            stroke={d.color}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap={stats.total === d.count ? "round" : "butt"} // Round if only 1 segment
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                })}
            </svg>
            
            {/* Center Emote */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl animate-bounce-slow filter drop-shadow-lg">{centerEmote}</span>
            </div>
        </div>

        {/* Legend */}
        <div className="flex-1 pl-6 space-y-2">
            <h3 className={`text-lg font-bold ${statusColor} mb-2`}>{statusText}</h3>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between text-emerald-400"><span>Completed</span> <span>{stats.counts.completed}</span></div>
                <div className="flex justify-between text-amber-400"><span>Running</span> <span>{stats.counts.running}</span></div>
                <div className="flex justify-between text-slate-400"><span>Pending</span> <span>{stats.counts.pending}</span></div>
                {stats.counts.failed > 0 && <div className="flex justify-between text-rose-400 font-bold"><span>Failed</span> <span>{stats.counts.failed}</span></div>}
            </div>
        </div>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    Low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide">
        <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
        Processing
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
        <CheckCircle size={14} /> Done
      </span>
    );
  }
  if (status === 'pending') {
    return <span className="text-slate-500 text-xs uppercase tracking-wide">Queue</span>;
  }
  return <span className="text-rose-400 text-xs uppercase tracking-wide flex items-center gap-1"><AlertCircle size={14}/> Failed</span>;
};

export default App;