'use client';

import { useAtom } from 'jotai';
import { currentUserAtom } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockForklifts, mockRentalCompanies } from '@/lib/mock-data';
import { Forklift, ForkliftManagementStatus, FORKLIFT_MANAGEMENT_STATUSES, UserRole } from '@/lib/types';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const singleForkliftSchema = z.object({
  manufacturer: z.string().min(1, { message: '제작사를 입력해주세요.' }),
  year: z.number().min(1900, { message: '유효한 년도를 입력해주세요.' }).max(new Date().getFullYear(), { message: '미래 년도는 입력할 수 없습니다.' }),
  tonnage: z.number().min(0.1, { message: '톤수를 입력해주세요.' }),
  type: z.string().min(1, { message: '유형을 입력해주세요.' }),
  chassisNumber: z.string().min(1, { message: '차대 번호를 입력해주세요.' }),
  modelName: z.string().min(1, { message: '모델명을 입력해주세요.' }),
  gpsSerialNumber: z.string().optional(),
  purchaseDate: z.string().min(1, { message: '구매 일자를 입력해주세요.' }),
  purchasePrice: z.number().min(0, { message: '구매 가격을 입력해주세요.' }),
  withdrawalDate: z.string().min(1, { message: '폐기 예정 일자를 입력해주세요.' }),
  location: z.string().min(1, { message: '현재 위치를 입력해주세요.' }),
  notes: z.string().optional(),
  managementStatus: z.enum(FORKLIFT_MANAGEMENT_STATUSES, { message: '관리 상태를 선택해주세요.' }),
  rentalCompanyId: z.string().min(1, { message: '렌탈사를 선택해주세요.' }),
});

type SingleForkliftFormValues = z.infer<typeof singleForkliftSchema>;

export default function ForkliftRegistrationPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  const singleForm = useForm<SingleForkliftFormValues>({
    resolver: zodResolver(singleForkliftSchema),
    defaultValues: {
      manufacturer: '',
      year: new Date().getFullYear(),
      tonnage: 0,
      type: '',
      chassisNumber: '',
      modelName: '',
      gpsSerialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      withdrawalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0],
      location: '',
      notes: '',
      managementStatus: 'IN_STORAGE',
      rentalCompanyId: currentUser?.rentalCompanyId || '',
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '지게차 등록에 접근할 권한이 없습니다.');
      router.push('/');
    }
  }, [currentUser, router]);

  const onSingleSubmit = async (values: SingleForkliftFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call and ID generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newForklift: Forklift = {
        id: `fork-${Date.now()}`,
        ...values,
      };
      mockForklifts.push(newForklift); // Add to mock data
      toast.success('지게차가 성공적으로 등록되었습니다.');
      singleForm.reset();
      router.push('/forklifts');
    } catch (error) {
      toast.error('등록 실패', '지게차 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newForklifts: Forklift[] = json.map((row, index) => {
          // Basic validation and mapping from Excel columns to Forklift type
          // This is a simplified example; real-world would need robust validation
          return {
            id: `fork-${Date.now()}-${index}`,
            manufacturer: row['제작사'] || 'Unknown',
            year: parseInt(row['년식']) || new Date().getFullYear(),
            tonnage: parseFloat(row['톤수']) || 0,
            type: row['유형'] || 'Unknown',
            chassisNumber: row['차대번호'] || `CHASSIS-${Date.now()}-${index}`,
            modelName: row['모델명'] || 'Unknown',
            gpsSerialNumber: row['GPS시리얼'] || undefined,
            purchaseDate: row['구매일자'] || new Date().toISOString().split('T')[0],
            purchasePrice: parseFloat(row['구매가격']) || 0,
            withdrawalDate: row['폐기예정일'] || new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0],
            location: row['위치'] || 'Unknown',
            notes: row['특이사항'] || undefined,
            managementStatus: (row['관리상태'] as ForkliftManagementStatus) || 'IN_STORAGE',
            rentalCompanyId: currentUser?.rentalCompanyId || mockRentalCompanies[0]?.id || '', // Assign to current user's company or first mock company
          };
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        mockForklifts.push(...newForklifts); // Add to mock data
        toast.success(`${newForklifts.length}대의 지게차가 성공적으로 일괄 등록되었습니다.`);
        router.push('/forklifts');
      } catch (error) {
        toast.error('파일 파싱 실패', 'Excel 파일을 읽는 중 오류가 발생했습니다. 형식을 확인해주세요.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
    return null; // Render nothing if not authorized, useEffect will redirect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">새 지게차 등록</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">개별 등록</TabsTrigger>
          <TabsTrigger value="batch">일괄 등록 (Excel)</TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>개별 지게차 정보 입력</CardTitle>
              <CardDescription>새로운 지게차의 상세 정보를 입력해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...singleForm}>
                <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-6">
                  <FormField
                    control={singleForm.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제작사 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="현대" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>모델명 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="HDF30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제작 년식 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2023" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="tonnage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>톤수 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="3.0" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>유형 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="디젤" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="chassisNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>차대 번호 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="HD2023001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="gpsSerialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPS 시리얼 번호</FormLabel>
                        <FormControl>
                          <Input placeholder="GPS12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>구매 일자 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>구매 가격 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30000000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="withdrawalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>폐기 예정 일자 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>현재 위치 <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="창고 A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>특이사항</FormLabel>
                        <FormControl>
                          <Input placeholder="특이사항 없음" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="managementStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>관리 상태 <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="관리 상태를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FORKLIFT_MANAGEMENT_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {status === 'IN_STORAGE' ? '보관 중' :
                                 status === 'RENTED' ? '렌탈 중' :
                                 status === 'ON_LOAN' ? '대여 중' :
                                 status === 'UNDER_REPAIR' ? '수리 중' :
                                 status === 'PART_REPLACEMENT' ? '부품 교체 중' :
                                 status === 'OVERDUE_RECOVERY' ? '연체 회수 중' :
                                 '폐기'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {currentUser?.role === 'OPERATION_TOOL_ADMIN' && (
                    <FormField
                      control={singleForm.control}
                      name="rentalCompanyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>렌탈사 <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="렌탈사를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockRentalCompanies.map(company => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '등록 중...' : '지게차 등록'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>지게차 일괄 등록 (Excel)</CardTitle>
              <CardDescription>Excel 파일을 업로드하여 여러 지게차를 한 번에 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Excel 파일은 다음 열을 포함해야 합니다: 제작사, 년식, 톤수, 유형, 차대번호, 모델명, GPS시리얼(선택), 구매일자, 구매가격, 폐기예정일, 위치, 특이사항(선택), 관리상태.
              </p>
              <Input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={isLoading} />
              <Button className="w-full" disabled={isLoading}>
                {isLoading ? '업로드 중...' : 'Excel 파일 업로드'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
