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
import { mockOverdueRecords, mockContracts, mockLessees } from '@/lib/mock-data';
import { OverdueRecord, UserRole, OverdueCaseType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function OverdueManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OverdueRecord | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'deduct' | 'request' | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '연체 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchOverdueRecords();
  }, [currentUser, router]);

  const fetchOverdueRecords = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredRecords = mockOverdueRecords.filter(record => {
        const contract = mockContracts.find(c => c.id === record.contractId);
        const isRelevantToUser = !currentUser?.rentalCompanyId || contract?.rentalCompanyId === currentUser.rentalCompanyId;
        return isRelevantToUser;
      });
      setOverdueRecords(filteredRecords);
      setLoading(false);
    }, 500);
  };

  const calculateOverdueFee = (contract: Contract, record: OverdueRecord) => {
    // Simplified calculation: 20% annual interest, daily compounded
    const dailyInterestRate = 0.20 / 365;
    const today = new Date();
    const paymentDueDate = new Date(contract.paymentDueDate);

    if (today <= paymentDueDate) return 0; // Not overdue yet

    const diffTime = today.getTime() - paymentDueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Assuming initial overdue amount is rentalFee if it's the first overdue
    const initialOverdueAmount = contract.rentalFee;
    const accumulatedFee = initialOverdueAmount * (1 + dailyInterestRate * diffDays);

    return Math.round(accumulatedFee);
  };

  const handleActionClick = (record: OverdueRecord, type: 'deduct' | 'request') => {
    setSelectedRecord(record);
    setActionType(type);
    setIsActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRecord || !actionType) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedRecords = overdueRecords.map(rec => {
        if (rec.id === selectedRecord.id) {
          const newHistory: OverdueCaseType[] = [...rec.notificationHistory];
          if (actionType === 'deduct') {
            newHistory.push('DEPOSIT_DEDUCTED');
            toast.success('보증금 차감 처리되었습니다.');
          } else if (actionType === 'request') {
            newHistory.push('RENTAL_FEE_OVERDUE'); // Or a more specific 'OVERDUE_REQUEST'
            toast.success('연체료 지급 요청 안내가 발송되었습니다.');
          }
          return { ...rec, lastNotificationDate: new Date().toISOString().split('T')[0], notificationHistory: newHistory };
        }
        return rec;
      });
      setOverdueRecords(updatedRecords);
      setIsActionDialogOpen(false);
      setSelectedRecord(null);
      setActionType(null);
    } catch (error) {
      toast.error('처리 실패', '연체 처리 중 오류가 발생했습니다.');
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
      <h1 className="text-3xl font-bold">연체 관리</h1>

      <Card>
        <CardHeader>
          <CardTitle>연체 계약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {overdueRecords.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              현재 연체된 계약이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>계약 ID</TableHead>
                    <TableHead>임차인</TableHead>
                    <TableHead>납부 예정일</TableHead>
                    <TableHead>누적 연체료</TableHead>
                    <TableHead>최종 안내일</TableHead>
                    <TableHead>추심 이력</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueRecords.map((record) => {
                    const contract = mockContracts.find(c => c.id === record.contractId);
                    const lessee = contract ? mockLessees.find(l => l.id === contract.lesseeId) : null;
                    const currentOverdueFee = contract ? calculateOverdueFee(contract, record) : record.accumulatedOverdueFee;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.contractId}</TableCell>
                        <TableCell>{lessee?.name || '알 수 없음'}</TableCell>
                        <TableCell>{contract?.paymentDueDate || '-'}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{currentOverdueFee.toLocaleString()}원</TableCell>
                        <TableCell>{record.lastNotificationDate || '-'}</TableCell>
                        <TableCell>
                          {record.notificationHistory.length > 0 ? (
                            <ul className="list-disc list-inside text-xs">
                              {record.notificationHistory.map((type, idx) => (
                                <li key={idx}>
                                  {type === 'RENTAL_FEE_OVERDUE' ? '렌탈료 연체 안내' :
                                   type === 'DEPOSIT_DEDUCTED' ? '보증금 차감' :
                                   type === 'CONTRACT_TERMINATED' ? '계약 해지 통보' :
                                   '내용증명 발송'}
                                </li>
                              ))}
                            </ul>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="secondary" size="sm" onClick={() => handleActionClick(record, 'deduct')} disabled={!contract?.deposit || contract.deposit <= 0}>
                            보증금 차감
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleActionClick(record, 'request')}>
                            연체료 요청 안내
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRecord && (actionType === 'deduct' || actionType === 'request') && (
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'deduct' ? '보증금 차감 확인' : '연체료 요청 안내 확인'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'deduct' ?
                  `계약 ID ${selectedRecord.contractId}의 보증금을 차감 처리하시겠습니까?` :
                  `계약 ID ${selectedRecord.contractId}의 임차인에게 연체료 지급 요청 안내를 발송하시겠습니까?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>취소</Button>
              <Button onClick={confirmAction} disabled={loading}>
                {loading ? '처리 중...' : '확인'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
