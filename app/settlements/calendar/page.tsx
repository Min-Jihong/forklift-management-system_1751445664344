'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { mockContracts, mockLessees } from '@/lib/mock-data';
import { Contract, UserRole } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SettlementCalendarPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filteredLesseeId, setFilteredLesseeId] = useState<string | 'ALL'>('ALL');
  const [filteredContractId, setFilteredContractId] = useState<string | 'ALL'>('ALL');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '정산 캘린더에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    setLoading(false);
  }, [currentUser, router]);

  const getEventsForDate = (date: Date) => {
    const events: { type: string; description: string; contractId: string; }[] = [];
    const dateString = format(date, 'yyyy-MM-dd');

    const relevantContracts = mockContracts.filter(contract => {
      const isRelevantToUser = !currentUser?.rentalCompanyId || contract.rentalCompanyId === currentUser.rentalCompanyId;
      const matchesLessee = filteredLesseeId === 'ALL' || contract.lesseeId === filteredLesseeId;
      const matchesContract = filteredContractId === 'ALL' || contract.id === filteredContractId;
      return isRelevantToUser && matchesLessee && matchesContract;
    });

    relevantContracts.forEach(contract => {
      // Rental fee payment due date
      if (contract.paymentDueDate === dateString) {
        events.push({
          type: '납부 예정',
          description: `${mockLessees.find(l => l.id === contract.lesseeId)?.name} 렌탈료 납부 예정 (${contract.rentalFee.toLocaleString()}원)`,
          contractId: contract.id,
        });
      }

      // Tax invoice issue date
      if (contract.taxInvoiceIssueDate === dateString) {
        events.push({
          type: '세금계산서 발행',
          description: `${mockLessees.find(l => l.id === contract.lesseeId)?.name} 세금계산서 발행 예정`,
          contractId: contract.id,
        });
      }

      // Contract end date
      if (contract.endDate === dateString) {
        events.push({
          type: '계약 종료',
          description: `${mockLessees.find(l => l.id === contract.lesseeId)?.name} 계약 종료 예정`,
          contractId: contract.id,
        });
      }
    });

    return events;
  };

  const renderDay = (day: Date) => {
    const events = getEventsForDate(day);
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return (
      <div className={`relative p-1 text-center text-sm ${isToday ? 'bg-blue-100 rounded-md' : ''}`}>
        {format(day, 'd')}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-0.5">
          {events.map((event, index) => (
            <span key={index} className={`w-1.5 h-1.5 rounded-full ${event.type === '납부 예정' ? 'bg-red-500' : event.type === '세금계산서 발행' ? 'bg-green-500' : 'bg-yellow-500'}`} title={event.description}></span>
          ))}
        </div>
      </div>
    );
  };

  const allLessees = currentUser?.rentalCompanyId
    ? mockLessees.filter(lessee => mockContracts.some(c => c.lesseeId === lessee.id && c.rentalCompanyId === currentUser.rentalCompanyId))
    : mockLessees;

  const allContracts = currentUser?.rentalCompanyId
    ? mockContracts.filter(c => c.rentalCompanyId === currentUser.rentalCompanyId)
    : mockContracts;

  const contractsForSelectedLessee = filteredLesseeId === 'ALL'
    ? allContracts
    : allContracts.filter(c => c.lesseeId === filteredLesseeId);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
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
      <h1 className="text-3xl font-bold">정산 캘린더</h1>

      <Card>
        <CardHeader>
          <CardTitle>정산 일정 조회</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Select value={filteredLesseeId} onValueChange={setFilteredLesseeId}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="임차인 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 임차인</SelectItem>
                  {allLessees.map(lessee => (
                    <SelectItem key={lessee.id} value={lessee.id}>
                      {lessee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filteredContractId} onValueChange={setFilteredContractId}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="계약 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 계약</SelectItem>
                  {contractsForSelectedLessee.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.id} ({mockLessees.find(l => l.id === contract.lesseeId)?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow w-full"
              locale={ko}
              components={{
                DayContent: ({ date }) => renderDay(date),
              }}
            />
          </div>
          <div className="flex-1 lg:max-w-xs space-y-4">
            <h3 className="text-xl font-semibold">선택된 날짜 ({selectedDate ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜를 선택하세요'})</h3>
            {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
              <ul className="space-y-2">
                {getEventsForDate(selectedDate).map((event, index) => (
                  <li key={index} className="p-3 border rounded-md bg-muted/50">
                    <p className="font-medium">{event.type}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground">계약 ID: {event.contractId}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">선택된 날짜에 일정이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
