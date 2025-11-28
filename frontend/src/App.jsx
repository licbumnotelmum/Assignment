import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Clock, Plus, Activity, CheckCircle, AlertCircle, 
  Terminal, Calendar, BarChart2, ArrowRight, Zap, Cpu
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const App = () => {
  // --- STATE ---
  const [jobs, setJobs] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form State
  const [formData, setFormData] = useState({
    taskName: '',
    priority: 'Low',
    duration: 3000,
    delay: 0, 
    payload: '{\n  "email": "user@example.com",\n  "type": "report"\n}'
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 1000); 
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  useEffect(() => {
    if (scheduledJobs.length === 0) return;
    const timer = setInterval(() => {
      setScheduledJobs(prev => {
        const nextState = prev.map(job => ({ ...job, remaining: job.remaining - 1 }));
        const readyJobs = nextState.filter(j => j.remaining <= 0);
        const waitingJobs = nextState.filter(j => j.remaining > 0);
        readyJobs.forEach(job => submitJobToBackend(job.data));
        return waitingJobs;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledJobs]);

  // --- API HANDLERS ---
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Backend offline or error:", err);
    }
  };

  const submitJobToBackend = async (data) => {
    try {
      await axios.post(`${API_URL}/jobs`, data);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Failed to auto-submit job", err);
    }
  };

  const handleCreateOrSchedule = async (e) => {
    e.preventDefault();
    if (formData.delay > 0) {
        setScheduledJobs([...scheduledJobs, { id: Date.now(), remaining: formData.delay, data: { ...formData } }]);
        setFormData({ ...formData, taskName: '', delay: 0 });
        return;
    }
    setLoading(true);
    try {
      await submitJobToBackend(formData);
      setFormData({ ...formData, taskName: '' });
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
    <div className="min-h-screen w-full bg-black text-zinc-400 p-6 lg:p-12 font-sans selection:bg-white selection:text-black">
      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                <Cpu size={24} strokeWidth={2.5} />
              </div>
              JOB<span className="font-light text-zinc-600">SCHEDULE</span>
            </h1>
            <p className="text-zinc-600 mt-3 font-mono text-xs uppercase tracking-[0.2em] pl-1">
              Schedules your jobs
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
             <div className="text-[10px] font-bold font-mono text-white border border-zinc-700 bg-zinc-950 px-5 py-2.5 rounded-sm flex items-center gap-3 shadow-lg">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
               SYSTEM ONLINE
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Dispatch Form */}
          <div className="lg:col-span-4 h-full">
            <TechCard title="Dispatch Interface" icon={<Plus size={16} />} height="h-full">
              <form onSubmit={handleCreateOrSchedule} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Task Identifier</label>
                  <input 
                    type="text" 
                    required
                    value={formData.taskName}
                    onChange={e => setFormData({...formData, taskName: e.target.value})}
                    className="w-full bg-black border border-zinc-800 p-4 focus:border-white focus:ring-0 outline-none transition-colors placeholder:text-zinc-800 text-sm text-white font-mono shadow-inner"
                    placeholder="e.g. SYNC_NODE_01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-black border border-zinc-800 p-4 focus:border-white outline-none text-sm appearance-none text-white shadow-inner"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Duration (ms)</label>
                    <input 
                      type="number" 
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full bg-black border border-zinc-800 p-4 focus:border-white outline-none text-sm text-white font-mono shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
                        <span>Time Delay</span>
                        <span className="text-xs text-white font-mono">{formData.delay === 0 ? 'IMMEDIATE' : `+${formData.delay}s`}</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="60" step="5"
                      value={formData.delay}
                      onChange={e => setFormData({...formData, delay: parseInt(e.target.value)})}
                      className="w-full accent-white h-0.5 bg-zinc-800 appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Payload</label>
                  <textarea 
                    rows="8"
                    value={formData.payload}
                    onChange={e => setFormData({...formData, payload: e.target.value})}
                    // CHANGED: Added 'resize-y' to allow user to expand the window
                    className="w-full bg-black border border-zinc-800 p-4 font-mono text-xs focus:border-white outline-none text-zinc-400 resize-y shadow-inner min-h-[150px]"
                  ></textarea>
                </div>

                <button 
                  disabled={loading}
                  className={`
                    w-full font-bold py-4 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4 text-xs uppercase tracking-widest border shadow-lg
                    ${formData.delay > 0 
                        ? 'bg-zinc-900 text-white border-zinc-600 hover:bg-zinc-800' 
                        : 'bg-white text-black border-white hover:bg-zinc-200 shadow-white/10'}
                  `}
                >
                  {formData.delay > 0 ? (
                      <><Calendar size={14} /> Schedule</>
                  ) : (
                      <><ArrowRight size={14} /> Execute</>
                  )}
                </button>
              </form>
            </TechCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Top Row: Terminal & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[340px]">
                {/* 1. Terminal (Logs) */}
                <EventTerminal jobs={jobs} />

                {/* 2. Live Timeline */}
                <LiveTimeline jobs={jobs} />
            </div>

            {/* Bottom Row: Active Table */}
            <div className="relative bg-zinc-950 border border-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.02)] min-h-[400px]">
              {/* Corners */}
              <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-l-2 border-t-2 border-white z-20"></div>
              <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-r-2 border-t-2 border-white z-20"></div>
              <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-l-2 border-b-2 border-white z-20"></div>
              <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-r-2 border-b-2 border-white z-20"></div>

              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Activity size={16} /> Active Queue
                </h2>
                <div className="flex gap-2">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 py-1 border border-zinc-800 bg-black">
                     DB: Connected
                   </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black text-zinc-500 uppercase text-[10px] font-bold tracking-widest border-b border-zinc-800">
                    <tr>
                      <th className="p-4 border-r border-zinc-800">ID</th>
                      <th className="p-4 border-r border-zinc-800">Task</th>
                      <th className="p-4 border-r border-zinc-800">Priority</th>
                      <th className="p-4 border-r border-zinc-800">State</th>
                      <th className="p-4 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-16 text-center text-zinc-600 flex flex-col items-center gap-2">
                          <Activity size={32} strokeWidth={1} className="opacity-30 mb-2" />
                          <span className="text-xs uppercase tracking-widest">No Active Jobs</span>
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-zinc-900/50 transition-colors group">
                          <td className="p-4 font-mono text-zinc-500 text-xs border-r border-zinc-800">#{job.id}</td>
                          <td className="p-4 border-r border-zinc-800">
                            <div className="font-bold text-white text-sm">{job.taskName}</div>
                            <div className="text-[10px] text-zinc-500 truncate max-w-[200px] font-mono mt-0.5">
                                {job.payload}
                            </div>
                          </td>
                          <td className="p-4 border-r border-zinc-800">
                            <PriorityBadge priority={job.priority} />
                          </td>
                          <td className="p-4 border-r border-zinc-800">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRun(job.id)}
                              disabled={job.status === 'running'}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all border
                                ${job.status === 'running' 
                                  ? 'bg-black text-zinc-600 border-zinc-800 cursor-not-allowed' 
                                  : 'bg-white text-black border-white hover:bg-zinc-200 shadow-[0_0_10px_rgba(255,255,255,0.1)]'}
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

          </div>
        </div>
      </div>
    </div>
  );
};

// --- TECH CARD COMPONENT ---
const TechCard = ({ title, icon, children, height = "h-auto" }) => {
  return (
    <div className={`relative bg-zinc-950 border border-zinc-800 p-6 shadow-[0_0_30px_rgba(255,255,255,0.02)] ${height}`}>
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-l-2 border-t-2 border-white z-20"></div>
      <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-r-2 border-t-2 border-white z-20"></div>
      <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-l-2 border-b-2 border-white z-20"></div>
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-r-2 border-b-2 border-white z-20"></div>

      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-wider border-b border-zinc-900 pb-3">
        {icon} {title}
      </h3>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// --- EVENT TERMINAL COMPONENT ---
const EventTerminal = ({ jobs }) => {
    // CHANGED: Use a ref for the scroll container instead of a dummy div
    const scrollContainerRef = useRef(null);
    
    const timelineEvents = [...jobs].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    // FIXED: Use scrollTop logic instead of scrollIntoView to prevent page jumping
    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            // Only auto-scroll if we are near the bottom (or just force it for a log feel)
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [jobs]); // Triggers whenever jobs update

    return (
        <TechCard title="System Log" icon={<Terminal size={16} />} height="h-full">
            <div className="flex flex-col h-[240px] bg-black border border-zinc-800 p-4 font-mono text-xs shadow-inner overflow-hidden">
                <div className="flex items-center gap-2 text-zinc-600 mb-2 border-b border-zinc-900 pb-2">
                    <span className="w-2 h-2 bg-zinc-600 rounded-full"></span>
                    <span className="uppercase tracking-wider font-bold text-[10px]">daemon_stream.log</span>
                </div>
                
                {/* CHANGED: Ref attached here, logic uses scrollTop */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {timelineEvents.length === 0 && (
                        <div className="text-zinc-700 italic opacity-50 text-[10px] mt-2">
                            // Waiting for input stream...
                        </div>
                    )}
                    
                    {timelineEvents.map((job) => (
                        <div key={job.id} className="flex gap-3 text-[10px] hover:bg-zinc-900/50 p-0.5 rounded">
                            <span className="text-zinc-600 font-bold whitespace-nowrap">
                                [{new Date(job.updatedAt).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]
                            </span>
                            <span className="flex-1">
                                <span className="text-zinc-500 mr-2">JOB_{job.id}</span>
                                {job.status === 'completed' && <span className="text-white">Process Completed. <span className="text-zinc-500">({job.duration}ms)</span></span>}
                                {job.status === 'running' && <span className="text-white animate-pulse">Processing Payload...</span>}
                                {job.status === 'pending' && <span className="text-zinc-500">Received & Queued.</span>}
                                {job.status === 'failed' && <span className="text-zinc-600 line-through">Error in execution.</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </TechCard>
    );
};

// --- LIVE TIMELINE COMPONENT ---
const LiveTimeline = ({ jobs }) => {
    const runningJobs = jobs.filter(j => j.status === 'running');

    return (
        <TechCard title="Live Execution" icon={<BarChart2 size={16} />} height="h-full">
            <style>{`
                @keyframes smoothProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress-smooth {
                    animation-name: smoothProgress;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                }
            `}</style>

            {runningJobs.length > 0}

            <div className="h-[240px] flex flex-col">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                    {runningJobs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-3 opacity-60">
                            <div className="w-16 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-zinc-800 animate-[shimmer_2s_infinite]"></div>
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-widest">Idle State</span>
                        </div>
                    ) : (
                        runningJobs.map(job => (
                            <ActiveJobBar key={job.id} job={job} />
                        ))
                    )}
                </div>
            </div>
        </TechCard>
    )
}

const ActiveJobBar = ({ job }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(prev => {
                const next = prev + 50;
                return next > job.duration ? job.duration : next;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [job.duration]);

    const formatTime = (ms) => (ms / 1000).toFixed(1) + 's';

    return (
        <div className="relative group p-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-2 items-end">
                <span className="text-white flex items-center gap-1.5">
                    <Zap size={12} />
                    Task #{job.id}
                </span>
                <span className="font-mono text-white bg-black px-1.5 border border-zinc-800">
                    {formatTime(elapsed)} / {formatTime(job.duration)}
                </span>
            </div>
            
            <div className="w-full h-4 bg-black border border-zinc-700 relative p-[2px] shadow-inner">
                <div 
                    className="h-full bg-white animate-progress-smooth relative"
                    style={{ animationDuration: `${job.duration}ms` }}
                ></div>
            </div>
            
            <div className="text-[9px] text-zinc-500 mt-1.5 font-mono flex justify-between px-1">
                <span>{job.taskName}</span>
                <span className="animate-pulse text-white">EXECUTING...</span>
            </div>
        </div>
    );
};

// --- BADGES ---

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "text-black bg-white border-white",
    Medium: "text-white bg-black border-white",
    Low: "text-zinc-500 bg-black border-zinc-800",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest">
        <span className="w-1.5 h-1.5 bg-white animate-pulse"></span>
        Active
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest decoration-zinc-600">
        <CheckCircle size={12} /> Done
      </span>
    );
  }
  if (status === 'pending') {
    return <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Queued</span>;
  }
  return <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle size={12}/> Failed</span>;
};

export default App;