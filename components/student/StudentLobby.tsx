import React, { useState } from 'react';
import { Wifi } from 'lucide-react';

interface StudentLobbyProps {
  onJoin: (code: string, name: string) => void;
  isLoading: boolean;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  onJoin,
  isLoading,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && name) onJoin(code, name);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-200">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl ring-1 ring-slate-700">
        <Wifi className="text-indigo-500 w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
        Classroom Live
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        Join your teacher&apos;s session
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="sr-only">Room Code</label>
          <input
            type="text"
            placeholder="Teacher ID / Room Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-center tracking-widest uppercase"
            required
          />
        </div>
        <div>
          <label className="sr-only">Your Name</label>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? 'Joining...' : 'Join Session'}
        </button>
      </form>
    </div>
  );
};
