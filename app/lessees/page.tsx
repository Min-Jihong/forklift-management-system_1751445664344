'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockLessees, mockContracts } from '@/lib/mock-data';
import { Lessee, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function LesseeManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lessees, setLessees] = useState<Lessee[]>([]);
  const [selectedLessee, setSelectedLessee] = useState<Lessee | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '임차인 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchLessees();
  }, [currentUser, router]);

  const fetchLessees = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Filter lessees by current user's rentalCompanyId if applicable
      const filteredLessees = currentUser?.rentalCompanyId
        ? mockLessees.filter(lessee => mockContracts.some(c => c.lesseeId === lessee.id && c.rentalCompanyId === currentUser.rentalCompanyId))
        : mockLessees;
      setLessees(filteredLessees);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = (lessee: Lessee) => {
    setSelectedLessee(lessee);
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
      <h1 className="text-3xl font-bold">임차인 관리</h1>

      <Card>
        <CardHeader>
          <CardTitle>등록된 임차인 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {lessees.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 임차인이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>사업자/주민등록번호</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessees.map((lessee) => (
                    <TableRow key={lessee.id}>
                      <TableCell className="font-medium">{lessee.name}</TableCell>
                      <TableCell>{lessee.registrationNumber}</TableCell>
                      <TableCell>{lessee.representative}</TableCell>
                      <TableCell>{lessee.phoneNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(lessee)}>
                          상세 보기
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

      {selectedLessee && (
        <Dialog open={!!selectedLessee} onOpenChange={() => setSelectedLessee(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>임차인 상세 정보: {selectedLessee.name}</DialogTitle>
              <DialogDescription>
                임차인의 기본 정보 및 계약 이력을 확인합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Label className="font-semibold">이름:</Label><span>{selectedLessee.name}</span>
                <Label className="font-semibold">사업자/주민등록번호:</Label><span>{selectedLessee.registrationNumber}</span>
                <Label className="font-semibold">주소:</Label><span>{selectedLessee.address || '-'}
                </span>
                <Label className="font-semibold">대표자:</Label><span>{selectedLessee.representative}</span>
                <Label className="font-semibold">연락처:</Label><span>{selectedLessee.phoneNumber}</span>
                <Label className="font-semibold">신용 등급:</Label><span>A+ (예시)</span>
              </div>
              <h3 className="text-lg font-semibold mt-4">계약 이력</h3>
              {selectedLessee.contractIds.length > 0 ? (
                <ul className="list-disc pl-5">
                  {selectedLessee.contractIds.map((contractId, index) => {
                    const contract = mockContracts.find(c => c.id === contractId);
                    return contract ? (
                      <li key={index}>[{contract.startDate} ~ {contract.endDate}] {contract.rentalFee.toLocaleString()}원 ({contract.status})</li>
                    ) : null;
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">계약 이력 없음</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedLessee(null)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
