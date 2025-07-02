'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockUsers } from '@/lib/mock-data';
import { User, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AccountManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'].includes(currentUser.role as UserRole)) {
      toast.error('권한 없음', '계정 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchAccounts();
  }, [currentUser, router]);

  const fetchAccounts = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Filter accounts based on current user's rentalCompanyId if not admin
      const filteredAccounts = currentUser?.role === 'OPERATION_TOOL_ADMIN'
        ? mockUsers
        : mockUsers.filter(user => user.rentalCompanyId === currentUser?.rentalCompanyId);
      setAccounts(filteredAccounts);
      setLoading(false);
    }, 500);
  };

  const handleDeleteClick = (accountId: string) => {
    setAccountToDelete(accountId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete));
      toast.success('계정이 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      toast.error('삭제 실패', '계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">계정 관리</h1>
        <Button onClick={() => router.push('/accounts/invite')}>새 계정 초대</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>등록된 계정 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 계정이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        {account.role === 'OPERATION_TOOL_ADMIN' ? '운영툴 관리자' :
                         account.role === 'BUSINESS_MANAGER' ? '사업 관리자' :
                         '운영자'}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentUser?.id !== account.id && ( // Prevent self-deletion
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(account.id)}>
                            삭제
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계정 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 이 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
