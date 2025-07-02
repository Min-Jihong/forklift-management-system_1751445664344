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
import { mockContracts, mockLessees, mockForklifts } from '@/lib/mock-data';
import { Contract, ContractType, CONTRACT_TYPES, PaymentMethod, PAYMENT_METHODS, UserRole, Lessee, Forklift } from '@/lib/types';
import { motion } from 'framer-motion';

const contractSchema = z.object({
  lesseeId: z.string().min(1, { message: '임차인을 선택해주세요.' }),
  forkliftId: z.string().min(1, { message: '지게차를 선택해주세요.' }),
  contractPdfUrl: z.string().optional(), // In a real app, this would be a file upload
  startDate: z.string().min(1, { message: '계약 시작일을 입력해주세요.' }),
  endDate: z.string().min(1, { message: '계약 종료일을 입력해주세요.' }),
  contractType: z.enum(CONTRACT_TYPES, { message: '계약 유형을 선택해주세요.' }),
  rentalFee: z.number().min(0, { message: '렌탈료를 입력해주세요.' }),
  shippingCost: z.number().optional(),
  deposit: z.number().optional(),
  repairCost: z.number().optional(),
  commission: z.number().optional(),
  earlyTerminationPenalty: z.number().optional(),
  taxInvoiceIssueDate: z.string().min(1, { message: '세금계산서 발행일을 입력해주세요.' }),
  paymentDueDate: z.string().min(1, { message: '납부 예정일을 입력해주세요.' }),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: '납부 방식을 선택해주세요.' }),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function ContractRegistrationPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableLessees, setAvailableLessees] = useState<Lessee[]>([]);
  const [availableForklifts, setAvailableForklifts] = useState<Forklift[]>([]);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      lesseeId: '',
      forkliftId: '',
      contractPdfUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      contractType: 'LONG_TERM',
      rentalFee: 0,
      shippingCost: 0,
      deposit: 0,
      repairCost: 0,
      commission: 0,
      earlyTerminationPenalty: 0,
      taxInvoiceIssueDate: new Date().toISOString().split('T')[0],
      paymentDueDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CMS_5TH',
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BUSINESS_MANAGER') {
      toast.error('권한 없음', '계약서 등록에 접근할 권한이 없습니다.');
      router.push('/');
      return;
    }
    // Filter lessees and forklifts by current user's rentalCompanyId
    const filteredLessees = currentUser?.rentalCompanyId
      ? mockLessees.filter(lessee => mockContracts.some(c => c.lesseeId === lessee.id && c.rentalCompanyId === currentUser.rentalCompanyId))
      : mockLessees;
    setAvailableLessees(filteredLessees);

    const filteredForklifts = currentUser?.rentalCompanyId
      ? mockForklifts.filter(forklift => forklift.rentalCompanyId === currentUser.rentalCompanyId)
      : mockForklifts;
    setAvailableForklifts(filteredForklifts);

  }, [currentUser, router]);

  const onSubmit = async (values: ContractFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call and ID generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newContract: Contract = {
        id: `cont-${Date.now()}`,
        ...values,
        status: 'RENTING', // Default status for new contracts
        history: [{ type: 'CONTRACT_SIGNED', date: new Date().toISOString().split('T')[0] }],
        rentalCompanyId: currentUser?.rentalCompanyId || mockRentalCompanies[0]?.id || '', // Assign to current user's company or first mock company
      };
      mockContracts.push(newContract); // Add to mock data

      // Update lessee's contractIds
      const lesseeIndex = mockLessees.findIndex(l => l.id === values.lesseeId);
      if (lesseeIndex !== -1) {
        mockLessees[lesseeIndex].contractIds.push(newContract.id);
      }

      // Update forklift's currentContractId and status
      const forkliftIndex = mockForklifts.findIndex(f => f.id === values.forkliftId);
      if (forkliftIndex !== -1) {
        mockForklifts[forkliftIndex].currentContractId = newContract.id;
        mockForklifts[forkliftIndex].managementStatus = 'RENTED';
      }

      toast.success('렌탈 계약서가 성공적으로 등록되었습니다.');
      form.reset();
      router.push('/contracts');
    } catch (error) {
      toast.error('등록 실패', '렌탈 계약서 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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
      <h1 className="text-3xl font-bold">새 렌탈 계약서 등록</h1>

      <Card>
        <CardHeader>
          <CardTitle>계약 정보 입력</CardTitle>
          <CardDescription>새로운 렌탈 계약서의 상세 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="lesseeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>임차인 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="임차인을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLessees.map(lessee => (
                          <SelectItem key={lessee.id} value={lessee.id}>
                            {lessee.name} ({lessee.registrationNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="forkliftId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지게차 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="지게차를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableForklifts.map(forklift => (
                          <SelectItem key={forklift.id} value={forklift.id}>
                            {forklift.modelName} ({forklift.chassisNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractPdfUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>계약서 PDF URL (임시)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/contract.pdf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계약 시작일 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계약 종료일 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>계약 유형 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="계약 유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type === 'LONG_TERM' ? '장기' : '단기'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <h3 className="text-lg font-semibold mt-6">정산 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentalFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>렌탈료 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>운송비</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>보증금</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repairCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수리비</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수수료</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="earlyTerminationPenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>중도 해지 위약금</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxInvoiceIssueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>세금계산서 발행일 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>납부 예정일 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>납부 방식 <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="납부 방식을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '등록 중...' : '계약서 등록'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
