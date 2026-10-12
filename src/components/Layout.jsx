import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useState } from 'react';

export default function Layout() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-[#f6f7fb] flex">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setOpen(o => !o)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
