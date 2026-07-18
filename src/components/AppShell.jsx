import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import PageTransition from './ui/PageTransition';

export default function AppShell() {
  const location = useLocation();

  return (
    <>
      <TopNav />
      <Sidebar />
      <main className="lg:ml-64 pt-16 min-h-[100dvh] pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <MobileNav />
    </>
  );
}
