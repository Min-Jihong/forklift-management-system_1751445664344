'use client';

import Link from 'next/link';
import { useAtom } from 'jotai';
import { currentUserAtom, isLoggedInAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const Header = () => {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const router = useRouter();

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    toast.success('로그아웃 되었습니다.');
    router.push('/');
  };

  const navItems = [
    { name: '대시보드', href: '/dashboard', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER', 'OPERATOR'] },
    { name: '렌탈사 관리', href: '/rental-companies', roles: ['OPERATION_TOOL_ADMIN'] },
    { name: '계정 관리', href: '/accounts', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'] },
    { name: '지게차 관리', href: '/forklifts', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER', 'OPERATOR'] },
    { name: '계약 관리', href: '/contracts', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'] },
    { name: '임차인 관리', href: '/lessees', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'] },
    { name: '정산 관리', href: '/settlements/calendar', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'] },
    { name: '연체 관리', href: '/settlements/overdue', roles: ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    isLoggedIn && currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
      className="bg-primary text-primary-foreground p-4 shadow-md"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          지게차 렌탈 시스템
        </Link>

        {isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-4">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.name}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <span className="sr-only">사용자 메뉴 열기</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}

        {isLoggedIn && (
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 pt-8">
                {filteredNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="text-lg font-medium hover:underline">
                    {item.name}
                  </Link>
                ))}
                <Button onClick={handleLogout} className="w-full mt-4">
                  로그아웃
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </motion.header>
  );
};
