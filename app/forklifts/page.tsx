'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockForklifts, mockContracts } from '@/lib/mock-data';
import { Forklift, ForkliftManagementStatus, ForkliftOperationStatus, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ForkliftManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forklifts, setForklifts] = useState<Forklift[]>([]);
  const [selectedForklift, setSelectedForklift] = useState<Forklift | null>(null);
  const [isRemoteControlDialogOpen, setIsRemoteControlDialogOpen] = useState(false);
  const [remoteAction, setRemoteAction] = useState<'start' | 'stop' | null>(null);

  useEffect(() => {
    if (!currentUser || !['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER', 'OPERATOR'].includes(currentUser.role as UserRole)) {
      toast.error('권한 없음', '지게차 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchForklifts();
  }, [currentUser, router]);

  const fetchForklifts = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredForklifts = currentUser?.rentalCompanyId
        ? mockForklifts.filter(f => f.rentalCompanyId === currentUser.rentalCompanyId)
        : mockForklifts;
      setForklifts(filteredForklifts);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = (forklift: Forklift) => {
    setSelectedForklift(forklift);
  };

  const handleRemoteControl = (forklift: Forklift, action: 'start' | 'stop') => {
    setSelectedForklift(forklift);
    setRemoteAction(action);
    setIsRemoteControlDialogOpen(true);
  };

  const confirmRemoteControl = async () => {
    if (!selectedForklift || !remoteAction) return;
    setLoading(true);
    try {
      // Simulate API call to update forklift operation status
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStatus: ForkliftOperationStatus = remoteAction === 'start' ? 'OPERATING' : 'REMOTE_STOPPED';
      setForklifts(prev => prev.map(f => f.id === selectedForklift.id ? { ...f, operationStatus: newStatus } : f));
      toast.success(`지게차 ${selectedForklift.chassisNumber} ${remoteAction === 'start' ? '원격 시동' : '원격 정지'} 명령이 전송되었습니다.`);
      setIsRemoteControlDialogOpen(false);
      setSelectedForklift(null);
      setRemoteAction(null);
    } catch (error) {
      toast.error('원격 제어 실패', '원격 제어 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: ForkliftManagementStatus | ForkliftOperationStatus | undefined) => {
    switch (status) {
      case 'RENTED':
      case 'OPERATING':
        return 'default';
      case 'IN_STORAGE':
      case 'STOPPED':
        return 'secondary';
      case 'UNDER_REPAIR':
      case 'UNAVAILABLE':
        return 'destructive';
      case 'ON_LOAN':
      case 'CHECKING':
        return 'outline';
      case 'OVERDUE_RECOVERY':
      case 'REMOTE_STOPPED':
        return 'warning'; // Assuming 'warning' variant exists or can be styled
      default:
        return 'info'; // Assuming 'info' variant exists or can be styled
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
        <h1 className="text-3xl font-bold">지게차 관리</h1>
        {currentUser?.role === 'BUSINESS_MANAGER' && (
          <Button onClick={() => router.push('/forklifts/register')}>새 지게차 등록</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>등록된 지게차 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {forklifts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 지게차가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>차대 번호</TableHead>
                    <TableHead>모델명</TableHead>
                    <TableHead>톤수</TableHead>
                    <TableHead>제작 년식</TableHead>
                    <TableHead>관리 상태</TableHead>
                    <TableHead>운행 상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forklifts.map((forklift) => (
                    <TableRow key={forklift.id}>
                      <TableCell className="font-medium">{forklift.chassisNumber}</TableCell>
                      <TableCell>{forklift.modelName}</TableCell>
                      <TableCell>{forklift.tonnage}톤</TableCell>
                      <TableCell>{forklift.year}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(forklift.managementStatus)}>
                          {forklift.managementStatus === 'IN_STORAGE' ? '보관 중' :
                           forklift.managementStatus === 'RENTED' ? '렌탈 중' :
                           forklift.managementStatus === 'ON_LOAN' ? '대여 중' :
                           forklift.managementStatus === 'UNDER_REPAIR' ? '수리 중' :
                           forklift.managementStatus === 'PART_REPLACEMENT' ? '부품 교체 중' :
                           forklift.managementStatus === 'OVERDUE_RECOVERY' ? '연체 회수 중' :
                           '폐기'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(forklift.operationStatus)}>
                          {forklift.operationStatus === 'CHECKING' ? '점검 중' :
                           forklift.operationStatus === 'UNAVAILABLE' ? '사용 불가' :
                           forklift.operationStatus === 'OPERATING' ? '운행 중' :
                           forklift.operationStatus === 'STOPPED' ? '정지' :
                           forklift.operationStatus === 'REMOTE_STOPPED' ? '원격 정지' :
                           '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(forklift)}>
                          상세 보기
                        </Button>
                        {currentUser?.role === 'BUSINESS_MANAGER' && (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => handleRemoteControl(forklift, 'start')} disabled={forklift.operationStatus === 'OPERATING'}>
                              원격 시동
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleRemoteControl(forklift, 'stop')} disabled={forklift.operationStatus === 'STOPPED' || forklift.operationStatus === 'REMOTE_STOPPED'}>
                              원격 정지
                            </Button>
                          </>
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

      {selectedForklift && (
        <Dialog open={!!selectedForklift} onOpenChange={() => setSelectedForklift(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>지게차 상세 정보: {selectedForklift.chassisNumber}</DialogTitle>
              <DialogDescription>
                지게차의 등록 정보, 계약 이력, 관리 이력 등을 확인합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Label className="font-semibold">제작사:</Label><span>{selectedForklift.manufacturer}</span>
                <Label className="font-semibold">모델명:</Label><span>{selectedForklift.modelName}</span>
                <Label className="font-semibold">년식:</Label><span>{selectedForklift.year}</span>
                <Label className="font-semibold">톤수:</Label><span>{selectedForklift.tonnage}톤</span>
                <Label className="font-semibold">유형:</Label><span>{selectedForklift.type}</span>
                <Label className="font-semibold">차대 번호:</Label><span>{selectedForklift.chassisNumber}</span>
                <Label className="font-semibold">GPS 시리얼:</Label><span>{selectedForklift.gpsSerialNumber || '-'}
                </span>
                <Label className="font-semibold">구매 일자:</Label><span>{selectedForklift.purchaseDate}</span>
                <Label className="font-semibold">구매 가격:</Label><span>{selectedForklift.purchasePrice.toLocaleString()}원</span>
                <Label className="font-semibold">폐기 예정일:</Label><span>{selectedForklift.withdrawalDate}</span>
                <Label className="font-semibold">현재 위치:</Label><span>{selectedForklift.location}</span>
                <Label className="font-semibold">관리 상태:</Label>
                <span>
                  <Badge variant={getStatusBadgeVariant(selectedForklift.managementStatus)}>
                    {selectedForklift.managementStatus === 'IN_STORAGE' ? '보관 중' :
                     selectedForklift.managementStatus === 'RENTED' ? '렌탈 중' :
                     selectedForklift.managementStatus === 'ON_LOAN' ? '대여 중' :
                     selectedForklift.managementStatus === 'UNDER_REPAIR' ? '수리 중' :
                     selectedForklift.managementStatus === 'PART_REPLACEMENT' ? '부품 교체 중' :
                     selectedForklift.managementStatus === 'OVERDUE_RECOVERY' ? '연체 회수 중' :
                     '폐기'}
                  </Badge>
                </span>
                <Label className="font-semibold">운행 상태:</Label>
                <span>
                  <Badge variant={getStatusBadgeVariant(selectedForklift.operationStatus)}>
                    {selectedForklift.operationStatus === 'CHECKING' ? '점검 중' :
                     selectedForklift.operationStatus === 'UNAVAILABLE' ? '사용 불가' :
                     selectedForklift.operationStatus === 'OPERATING' ? '운행 중' :
                     selectedForklift.operationStatus === 'STOPPED' ? '정지' :
                     selectedForklift.operationStatus === 'REMOTE_STOPPED' ? '원격 정지' :
                     '-'}
                  </Badge>
                </span>
                <Label className="font-semibold">특이사항:</Label><span>{selectedForklift.notes || '-'}
                </span>
              </div>
              <h3 className="text-lg font-semibold mt-4">관련 계약 정보</h3>
              {selectedForklift.currentContractId ? (
                <div className="grid grid-cols-2 gap-2">
                  <Label className="font-semibold">계약 ID:</Label><span>{selectedForklift.currentContractId}</span>
                  <Label className="font-semibold">계약 상태:</Label><span>{selectedForklift.contractStatus || '-'}
                  </span>
                  {/* More contract details can be added here by looking up mockContracts */}
                </div>
              ) : (
                <p className="text-muted-foreground">현재 계약 중인 지게차가 아닙니다.</p>
              )}
              {/* Placeholder for Management History and Usage Time */}
              <h3 className="text-lg font-semibold mt-4">관리 이력 (예시)</h3>
              <p className="text-muted-foreground">관리 이력 데이터가 없습니다.</p>
              <h3 className="text-lg font-semibold mt-4">사용 시간 (예시)</h3>
              <p className="text-muted-foreground">사용 시간 데이터가 없습니다.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedForklift(null)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isRemoteControlDialogOpen && selectedForklift && (
        <Dialog open={isRemoteControlDialogOpen} onOpenChange={setIsRemoteControlDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>지게차 원격 제어</DialogTitle>
              <DialogDescription>
                지게차 {selectedForklift.chassisNumber}를 {remoteAction === 'start' ? '시동' : '정지'}하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoteControlDialogOpen(false)}>취소</Button>
              <Button onClick={confirmRemoteControl} disabled={loading}>
                {loading ? '처리 중...' : remoteAction === 'start' ? '시동' : '정지'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
