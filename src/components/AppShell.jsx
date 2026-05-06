import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppShell() {
  return (
    <>
      <TopNav />
      <Sidebar />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </>
  );
}
