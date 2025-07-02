'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockRentalCompanies } from '@/lib/mock-data';
import { RentalCompany, RentalCompanyStatus, RENTAL_COMPANY_STATUSES, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RentalCompanyManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rentalCompanies, setRentalCompanies] = useState<RentalCompany[]>([]);
  const [editingCompany, setEditingCompany] = useState<RentalCompany | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'OPERATION_TOOL_ADMIN') {
      toast.error('권한 없음', '렌탈사 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchRentalCompanies();
  }, [currentUser, router]);

  const fetchRentalCompanies = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRentalCompanies(mockRentalCompanies);
      setLoading(false);
    }, 500);
  };

  const handleEditClick = (company: RentalCompany) => {
    setEditingCompany({ ...company });
  };

  const handleSaveEdit = async () => {
    if (!editingCompany) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setRentalCompanies(prev => prev.map(rc => rc.id === editingCompany.id ? editingCompany : rc));
      toast.success('렌탈사 정보가 수정되었습니다.');
      setEditingCompany(null);
    } catch (error) {
      toast.error('수정 실패', '렌탈사 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (companyId: string) => {
    setCompanyToDelete(companyId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setRentalCompanies(prev => prev.filter(rc => rc.id !== companyToDelete));
      toast.success('렌탈사가 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      toast.error('삭제 실패', '렌탈사 삭제 중 오류가 발생했습니다.');
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
        <h1 className="text-3xl font-bold">렌탈사 관리</h1>
        <Button onClick={() => router.push('/rental-companies/register')}>새 렌탈사 등록</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>등록된 렌탈사 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {rentalCompanies.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 렌탈사가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>법인 등록 번호</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.registrationNumber || '-'}</TableCell>
                      <TableCell>{company.representative || '-'}</TableCell>
                      <TableCell>{company.phoneNumber || '-'}</TableCell>
                      <TableCell>{company.status === 'ACTIVE' ? '이용 중' : company.status === 'PREPARING' ? '준비 중' : '이용 중단'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(company)}>
                          수정
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(company.id)}>
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>렌탈사 정보 수정</DialogTitle>
              <DialogDescription>
                렌탈사 정보를 수정하고 저장하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">이름</Label>
                <Input id="name" value={editingCompany.name} onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="registrationNumber" className="text-right">법인 등록 번호</Label>
                <Input id="registrationNumber" value={editingCompany.registrationNumber || ''} onChange={(e) => setEditingCompany({ ...editingCompany, registrationNumber: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">주소</Label>
                <Input id="address" value={editingCompany.address || ''} onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="representative" className="text-right">대표자</Label>
                <Input id="representative" value={editingCompany.representative || ''} onChange={(e) => setEditingCompany({ ...editingCompany, representative: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phoneNumber" className="text-right">전화번호</Label>
                <Input id="phoneNumber" value={editingCompany.phoneNumber || ''} onChange={(e) => setEditingCompany({ ...editingCompany, phoneNumber: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">상태</Label>
                <Select value={editingCompany.status} onValueChange={(value) => setEditingCompany({ ...editingCompany, status: value as RentalCompanyStatus })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {RENTAL_COMPANY_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'ACTIVE' ? '이용 중' : status === 'PREPARING' ? '준비 중' : '이용 중단'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCompany(null)}>취소</Button>
              <Button onClick={handleSaveEdit} disabled={loading}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>렌탈사 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 이 렌탈사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
