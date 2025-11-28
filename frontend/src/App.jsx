import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Play, Clock, Server, Plus, Activity, CheckCircle, AlertCircle, 
  Terminal, PieChart, Cpu, Zap, BarChart3, Database 
} from 'lucide-react';

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

  // Poll for updates
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000); 
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
      alert("Error: " + err.response?.data?.error);
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 lg:p-10 font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              NEBULA<span className="text-slate-700 font-thin">ENGINE</span>
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
              <Server size={16} className="text-purple-500" /> Distributed Job Scheduler
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
             <div className="text-xs font-mono text-slate-500 hidden sm:block">
                v2.4.0-stable
             </div>
             <div className="text-xs font-bold font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 animate-pulse flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
               SYSTEM ONLINE
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (4 Cols): Inputs & Stats */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Ring Chart */}
            <StatusChart jobs={jobs} />

            {/* 2. Create Job Form */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
              
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                <Plus size={18} className="text-purple-400" /> Dispatch New Job
              </h2>
              
              <form onSubmit={handleCreate} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Task Identifier</label>
                  <input 
                    type="text" 
                    required
                    value={formData.taskName}
                    onChange={e => setFormData({...formData, taskName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 text-sm"
                    placeholder="e.g. Generate Invoice #8841"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Priority Level</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none text-sm appearance-none"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Est. Duration (ms)</label>
                    <input 
                      type="number" 
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Payload Data</label>
                  <textarea 
                    rows="3"
                    value={formData.payload}
                    onChange={e => setFormData({...formData, payload: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none text-slate-300 resize-none"
                  ></textarea>
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-purple-50 font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
                >
                  {loading ? 'Dispatching...' : 'Initialize Task'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (8 Cols): Dashboard & Data */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. NEW: Performance Metrics Cards */}
            <MetricsRow jobs={jobs} />

            {/* 2. NEW: Cluster Health & Worker Visualizer */}
            <ClusterStatus jobs={jobs} />

            {/* 3. Job Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[300px]">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-indigo-400" /> Active Queue
                </h2>
                <div className="flex gap-2">
                   <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                     MySQL Database
                   </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/30 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Task Payload</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">State</th>
                      <th className="p-4 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                          <Database size={32} className="opacity-20 mb-2" />
                          <span className="text-sm">Database is empty. Dispatch a job to begin.</span>
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-purple-500/5 transition-colors group">
                          <td className="p-4 font-mono text-slate-600 text-xs">#{job.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-200 text-sm">{job.taskName}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[200px] font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
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
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all
                                ${job.status === 'running' 
                                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-transparent' 
                                  : 'bg-white text-black hover:bg-indigo-50 shadow-lg shadow-white/5 border border-transparent'}
                              `}
                            >
                              {job.status === 'running' ? <Clock size={12} className="animate-spin" /> : <Play size={12} />}
                              {job.status === 'running' ? 'Busy' : 'Run'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Terminal */}
            <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl p-4 font-mono text-xs h-40 overflow-y-auto shadow-inner relative">
              <div className="flex items-center gap-2 text-slate-500 mb-3 border-b border-white/5 pb-2 sticky top-0 bg-[#0a0a0a] z-10">
                <Terminal size={14} className="text-purple-500" /> 
                <span className="uppercase tracking-wider font-bold text-[10px]">daemon_logs.txt</span>
              </div>
              <div className="space-y-1.5 pl-1">
                {jobs.slice(0, 5).map((job, i) => (
                  <div key={i} className="opacity-80 flex gap-3 text-[11px]">
                   <span className="text-slate-700">[{new Date(job.updatedAt).toLocaleTimeString()}]</span>
                   <span>
                    {job.status === 'completed' && <span className="text-emerald-500">POST /webhook &bull; 200 OK &bull; {job.duration}ms</span>}
                    {job.status === 'running' && <span className="text-amber-500">Worker allocated for Task #{job.id}</span>}
                    {job.status === 'pending' && <span className="text-slate-500">Job #{job.id} pushed to Redis queue</span>}
                    {job.status === 'failed' && <span className="text-rose-500">Error: Exception in Task #{job.id}</span>}
                   </span>
                  </div>
                ))}
                <div className="text-purple-500 animate-pulse mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-purple-500 block"></span> 
                    awaiting input...
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: Performance Metrics ---
const MetricsRow = ({ jobs }) => {
    const stats = useMemo(() => {
        const completed = jobs.filter(j => j.status === 'completed');
        const total = jobs.length;
        const successRate = total ? Math.round((completed.length / total) * 100) : 100;
        
        // Calculate Avg Duration
        const totalTime = completed.reduce((acc, curr) => acc + (curr.duration || 3000), 0);
        const avgTime = completed.length ? Math.round(totalTime / completed.length / 100) / 10 : 0; // in seconds

        return { successRate, avgTime, total };
    }, [jobs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Success Rate</div>
                    <div className="text-2xl font-black text-white">{stats.successRate}%</div>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Zap size={24} />
                </div>
                <div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Avg Latency</div>
                    <div className="text-2xl font-black text-white">{stats.avgTime}s</div>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                    <Cpu size={24} />
                </div>
                <div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Throughput</div>
                    <div className="text-2xl font-black text-white">{stats.total} <span className="text-xs text-slate-600 font-medium">JOBS</span></div>
                </div>
            </div>
        </div>
    )
}

// --- NEW COMPONENT: Cluster Visualizer ---
const ClusterStatus = ({ jobs }) => {
    const activeJobs = jobs.filter(j => j.status === 'running').length;
    
    // Simulate CPU Usage based on active jobs
    const cpuLoad = activeJobs > 0 ? 40 + (activeJobs * 10) : 4; 
    const memoryLoad = 24; // Static base

    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-8 items-center justify-between">
            {/* Left: Text Stats */}
            <div className="space-y-4 w-full md:w-1/3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server size={16} className="text-slate-400"/> Node Health
                </h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>CPU Usage</span>
                            <span>{cpuLoad}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${cpuLoad}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Memory (RAM)</span>
                            <span>{memoryLoad}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${memoryLoad}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Visual Nodes */}
            <div className="flex-1 w-full border-l border-slate-800 pl-0 md:pl-8">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Active Worker Threads</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[...Array(8)].map((_, i) => {
                        const isActive = i < activeJobs;
                        return (
                            <div 
                                key={i} 
                                className={`
                                    h-12 rounded-lg border flex items-center justify-center transition-all duration-500
                                    ${isActive 
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105' 
                                        : 'bg-slate-900 border-slate-800 text-slate-700'}
                                `}
                            >
                                <Zap size={16} className={isActive ? 'animate-pulse' : 'opacity-20'} />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// --- ORIGINAL CHARTS & BADGES ---

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

  let centerEmote = "💤";
  let statusText = "System Idle";
  let statusColor = "text-slate-500";

  if (stats.total > 0) {
    if (stats.counts.failed > 0) { centerEmote = "💀"; statusText = "Critical Error"; statusColor = "text-rose-500"; }
    else if (stats.counts.running > 0) { centerEmote = "🚀"; statusText = "Processing"; statusColor = "text-amber-400"; }
    else if (stats.counts.pending > 0) { centerEmote = "⏳"; statusText = "Queued"; statusColor = "text-slate-400"; }
    else if (stats.counts.completed === stats.total) { centerEmote = "✨"; statusText = "All Clear"; statusColor = "text-emerald-400"; }
  }

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const data = [
    { type: 'completed', count: stats.counts.completed, color: '#10b981' }, 
    { type: 'running', count: stats.counts.running, color: '#f59e0b' },   
    { type: 'failed', count: stats.counts.failed, color: '#f43f5e' },     
    { type: 'pending', count: stats.counts.pending, color: '#334155' },   
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg backdrop-blur-sm">
        <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="10" fill="none" />
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
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap={stats.total === d.count ? "round" : "butt"} 
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl animate-bounce-slow filter drop-shadow-lg">{centerEmote}</span>
            </div>
        </div>
        <div className="flex-1 pl-6">
            <h3 className={`text-sm font-black uppercase tracking-widest ${statusColor} mb-3`}>{statusText}</h3>
            <div className="space-y-1.5 text-xs font-medium">
                <div className="flex justify-between text-slate-400"><span>Done</span> <span className="text-emerald-400">{stats.counts.completed}</span></div>
                <div className="flex justify-between text-slate-400"><span>Active</span> <span className="text-amber-400">{stats.counts.running}</span></div>
                <div className="flex justify-between text-slate-400"><span>Queue</span> <span className="text-slate-200">{stats.counts.pending}</span></div>
            </div>
        </div>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "text-rose-400 bg-rose-400/10 border-rose-400/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    Low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        Processing
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
        <CheckCircle size={14} /> Success
      </span>
    );
  }
  if (status === 'pending') {
    return <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Queued</span>;
  }
  return <span className="text-rose-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle size={14}/> Error</span>;
};

export default App;