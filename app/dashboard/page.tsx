'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockContracts, mockSettlementItems } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { UserRole, SETTLEMENT_ITEM_TYPES } from '@/lib/types';

export default function DashboardPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [filterItem, setFilterItem] = useState<string>('ALL');
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (!currentUser || !['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER', 'OPERATOR'].includes(currentUser.role as UserRole)) {
      toast.error('권한 없음', '대시보드에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    setLoading(false);
    fetchDashboardData();
  }, [currentUser, router, timeframe, filterItem]);

  const fetchDashboardData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredSettlements = mockSettlementItems.filter(item => {
        const contract = mockContracts.find(c => c.id === item.contractId);
        const isRelevantToUser = !currentUser?.rentalCompanyId || contract?.rentalCompanyId === currentUser.rentalCompanyId;
        const matchesFilter = filterItem === 'ALL' || item.type === filterItem;
        return isRelevantToUser && matchesFilter;
      });

      let revenue = 0;
      let cost = 0;
      const dataMap = new Map();

      filteredSettlements.forEach(item => {
        const date = new Date(item.date);
        let key = '';
        if (timeframe === 'daily') {
          key = date.toISOString().split('T')[0];
        } else if (timeframe === 'monthly') {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else {
          key = `${date.getFullYear()}`;
        }

        if (!dataMap.has(key)) {
          dataMap.set(key, { revenue: 0, cost: 0, name: key });
        }

        const currentData = dataMap.get(key);
        if (item.type === 'RENTAL_FEE' || item.type === 'DEPOSIT') {
          revenue += item.amount;
          currentData.revenue += item.amount;
        } else {
          cost += item.amount;
          currentData.cost += item.amount;
        }
      });

      const sortedData = Array.from(dataMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      setChartData(sortedData);
      setTotalRevenue(revenue);
      setTotalCost(cost);
      setLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold">대시보드</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={timeframe} onValueChange={(value) => setTimeframe(value as 'daily' | 'monthly' | 'yearly')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">일별</SelectItem>
            <SelectItem value="monthly">월별</SelectItem>
            <SelectItem value="yearly">연별</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterItem} onValueChange={setFilterItem}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정산 항목 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            {SETTLEMENT_ITEM_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'RENTAL_FEE' ? '렌탈료' : type === 'SHIPPING_COST' ? '운송비' : type === 'DEPOSIT' ? '보증금' : type === 'REPAIR_COST' ? '수리비' : type === 'COMMISSION' ? '수수료' : type === 'EARLY_TERMINATION_PENALTY' ? '위약금' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출액</CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground">기간 내 렌탈료 및 보증금 합산</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 비용</CardTitle>
            <span className="text-muted-foreground">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground">기간 내 운송비, 수리비 등 합산</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순이익</CardTitle>
            <span className="text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalRevenue - totalCost).toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground">총 매출액 - 총 비용</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기간별 매출 및 비용 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                <Legend />
                <Bar dataKey="revenue" name="매출" fill="#8884d8" />
                <Bar dataKey="cost" name="비용" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
