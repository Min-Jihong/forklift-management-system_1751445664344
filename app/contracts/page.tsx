'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockContracts, mockLessees, mockForklifts } from '@/lib/mock-data';
import { Contract, ContractStatus, CONTRACT_STATUSES, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ContractManagementPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContractStatus | 'ALL'>('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '계약 관리에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    fetchContracts();
  }, [currentUser, router]);

  const fetchContracts = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredContracts = mockContracts.filter(contract => {
        const lessee = mockLessees.find(l => l.id === contract.lesseeId);
        const forklift = mockForklifts.find(f => f.id === contract.forkliftId);

        const matchesSearch = searchTerm === '' ||
          lessee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          forklift?.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'ALL' || contract.status === filterStatus;

        const isRelevantToUser = !currentUser?.rentalCompanyId || contract.rentalCompanyId === currentUser.rentalCompanyId;

        return matchesSearch && matchesStatus && isRelevantToUser;
      });
      setContracts(filteredContracts);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchContracts();
  }, [searchTerm, filterStatus]);

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const handleStatusChange = async (contractId: string, newStatus: ContractStatus) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: newStatus } : c));
      toast.success('계약 상태가 변경되었습니다.');
    } catch (error) {
      toast.error('상태 변경 실패', '계약 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendContract = (contract: Contract) => {
    setSelectedContract(contract);
    setNewEndDate(contract.endDate);
    setIsExtendDialogOpen(true);
  };

  const confirmExtendContract = async () => {
    if (!selectedContract || !newEndDate) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setContracts(prev => prev.map(c => c.id === selectedContract.id ? { ...c, endDate: newEndDate, history: [...c.history, { type: 'CONTRACT_EXTENDED', date: new Date().toISOString().split('T')[0], description: `계약 종료일이 ${newEndDate}로 연장됨` }] } : c));
      toast.success('계약이 성공적으로 연장되었습니다.');
      setIsExtendDialogOpen(false);
      setSelectedContract(null);
      setNewEndDate('');
    } catch (error) {
      toast.error('계약 연장 실패', '계약 연장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingDays = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <h1 className="text-3xl font-bold">계약 관리</h1>
        <Button onClick={() => router.push('/contracts/register')}>새 계약서 등록</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="임차인 또는 지게차 차대 번호 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ContractStatus | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 상태</SelectItem>
            {CONTRACT_STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'RENTING' ? '렌탈 중' :
                 status === 'CONTRACT_ENDED' ? '계약 종료' :
                 status === 'MID_TERM_TERMINATION' ? '중도 해지' :
                 status === 'ON_HOLD' ? '보류' :
                 '회수 대기'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>등록된 렌탈 계약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              등록된 계약이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>계약 ID</TableHead>
                    <TableHead>임차인</TableHead>
                    <TableHead>지게차</TableHead>
                    <TableHead>계약 기간</TableHead>
                    <TableHead>잔여 기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const lessee = mockLessees.find(l => l.id === contract.lesseeId);
                    const forklift = mockForklifts.find(f => f.id === contract.forkliftId);
                    const remainingDays = calculateRemainingDays(contract.endDate);

                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.id}</TableCell>
                        <TableCell>{lessee?.name || '알 수 없음'}</TableCell>
                        <TableCell>{forklift?.chassisNumber || '알 수 없음'}</TableCell>
                        <TableCell>{contract.startDate} ~ {contract.endDate}</TableCell>
                        <TableCell>
                          {remainingDays > 0 ? `${remainingDays}일 남음` : '기간 만료'}
                        </TableCell>
                        <TableCell>
                          {contract.status === 'RENTING' ? '렌탈 중' :
                           contract.status === 'CONTRACT_ENDED' ? '계약 종료' :
                           contract.status === 'MID_TERM_TERMINATION' ? '중도 해지' :
                           contract.status === 'ON_HOLD' ? '보류' :
                           '회수 대기'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(contract)}>
                            상세 보기
                          </Button>
                          {contract.status === 'RENTING' && (
                            <>
                              <Button variant="secondary" size="sm" onClick={() => handleExtendContract(contract)}>
                                연장
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleStatusChange(contract.id, 'MID_TERM_TERMINATION')}>
                                해지
                              </Button>
                            </>
                          )}
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

      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>계약 상세 정보: {selectedContract.id}</DialogTitle>
              <DialogDescription>
                계약서의 상세 정보 및 이력을 확인합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Label className="font-semibold">임차인:</Label><span>{mockLessees.find(l => l.id === selectedContract.lesseeId)?.name || 'N/A'}</span>
                <Label className="font-semibold">지게차:</Label><span>{mockForklifts.find(f => f.id === selectedContract.forkliftId)?.chassisNumber || 'N/A'}</span>
                <Label className="font-semibold">계약 기간:</Label><span>{selectedContract.startDate} ~ {selectedContract.endDate}</span>
                <Label className="font-semibold">계약 유형:</Label><span>{selectedContract.contractType === 'LONG_TERM' ? '장기' : '단기'}</span>
                <Label className="font-semibold">상태:</Label><span>{selectedContract.status === 'RENTING' ? '렌탈 중' : selectedContract.status === 'CONTRACT_ENDED' ? '계약 종료' : selectedContract.status === 'MID_TERM_TERMINATION' ? '중도 해지' : selectedContract.status === 'ON_HOLD' ? '보류' : '회수 대기'}</span>
                <Label className="font-semibold">렌탈료:</Label><span>{selectedContract.rentalFee.toLocaleString()}원</span>
                <Label className="font-semibold">운송비:</Label><span>{selectedContract.shippingCost?.toLocaleString() || '-'}원</span>
                <Label className="font-semibold">보증금:</Label><span>{selectedContract.deposit?.toLocaleString() || '-'}원</span>
                <Label className="font-semibold">수리비:</Label><span>{selectedContract.repairCost?.toLocaleString() || '-'}원</span>
                <Label className="font-semibold">수수료:</Label><span>{selectedContract.commission?.toLocaleString() || '-'}원</span>
                <Label className="font-semibold">위약금:</Label><span>{selectedContract.earlyTerminationPenalty?.toLocaleString() || '-'}원</span>
                <Label className="font-semibold">세금계산서 발행일:</Label><span>{selectedContract.taxInvoiceIssueDate}</span>
                <Label className="font-semibold">납부 예정일:</Label><span>{selectedContract.paymentDueDate}</span>
                <Label className="font-semibold">납부 방식:</Label><span>{selectedContract.paymentMethod}</span>
                <Label className="font-semibold">계약서 PDF:</Label>
                <span>
                  {selectedContract.contractPdfUrl ? (
                    <a href={selectedContract.contractPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      다운로드
                    </a>
                  ) : ('-')}
                </span>
              </div>
              <h3 className="text-lg font-semibold mt-4">계약 이력</h3>
              {selectedContract.history.length > 0 ? (
                <ul className="list-disc pl-5">
                  {selectedContract.history.map((entry, index) => (
                    <li key={index}>[{entry.date}] {entry.type}: {entry.description || '내용 없음'}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">이력 없음</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedContract(null)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isExtendDialogOpen && selectedContract && (
        <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>계약 연장</DialogTitle>
              <DialogDescription>
                {selectedContract.id} 계약의 새로운 종료일을 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="newEndDate">새로운 종료일</Label>
              <Input
                id="newEndDate"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>취소</Button>
              <Button onClick={confirmExtendContract} disabled={loading}>연장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
