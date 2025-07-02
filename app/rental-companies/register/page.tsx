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
import { mockRentalCompanies } from '@/lib/mock-data';
import { RentalCompany, UserRole } from '@/lib/types';
import { motion } from 'framer-motion';

const rentalCompanySchema = z.object({
  name: z.string().min(1, { message: '렌탈사 이름은 필수입니다.' }),
  registrationNumber: z.string().optional(),
  address: z.string().optional(),
  representative: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type RentalCompanyFormValues = z.infer<typeof rentalCompanySchema>;

export default function RentalCompanyRegistrationPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RentalCompanyFormValues>({
    resolver: zodResolver(rentalCompanySchema),
    defaultValues: {
      name: '',
      registrationNumber: '',
      address: '',
      representative: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'OPERATION_TOOL_ADMIN') {
      toast.error('권한 없음', '렌탈사 등록에 접근할 권한이 없습니다.');
      router.push('/');
    }
  }, [currentUser, router]);

  const onSubmit = async (values: RentalCompanyFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call and ID generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newCompany: RentalCompany = {
        id: `rc-${Date.now()}`,
        ...values,
        status: 'PREPARING', // Default status for new companies
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRentalCompanies.push(newCompany); // Add to mock data
      toast.success('렌탈사가 성공적으로 등록되었습니다.');
      form.reset();
      router.push('/rental-companies');
    } catch (error) {
      toast.error('등록 실패', '렌탈사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'OPERATION_TOOL_ADMIN') {
    return null; // Render nothing if not authorized, useEffect will redirect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">새 렌탈사 등록</h1>

      <Card>
        <CardHeader>
          <CardTitle>렌탈사 정보 입력</CardTitle>
          <CardDescription>새로운 렌탈사의 상세 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>렌탈사 이름 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="(주)대한렌탈" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>법인 등록 번호</FormLabel>
                    <FormControl>
                      <Input placeholder="123-45-67890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="서울시 강남구 테헤란로 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="representative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>대표자</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호</FormLabel>
                    <FormControl>
                      <Input placeholder="02-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '등록 중...' : '렌탈사 등록'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
