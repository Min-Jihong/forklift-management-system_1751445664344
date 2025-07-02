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
import { mockUsers, mockRentalCompanies } from '@/lib/mock-data';
import { User, UserRole, USER_ROLES } from '@/lib/types';
import { motion } from 'framer-motion';

const inviteSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  role: z.enum(USER_ROLES, { message: '권한을 선택해주세요.' }),
  rentalCompanyId: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function AccountInvitationPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: undefined,
      rentalCompanyId: undefined,
    },
  });

  const selectedRole = form.watch('role');

  useEffect(() => {
    if (!currentUser || !['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'].includes(currentUser.role as UserRole)) {
      toast.error('권한 없음', '계정 초대에 접근할 권한이 없습니다.');
      router.push('/');
    }
  }, [currentUser, router]);

  const onSubmit = async (values: InviteFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call and ID generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (mockUsers.some(u => u.email === values.email)) {
        toast.error('초대 실패', '이미 등록된 이메일 주소입니다.');
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name: values.email.split('@')[0], // Simple name generation
        ...values,
      };
      mockUsers.push(newUser); // Add to mock data
      toast.success(`${values.email} 계정 초대 이메일이 발송되었습니다.`);
      form.reset();
      router.push('/accounts');
    } catch (error) {
      toast.error('초대 실패', '계정 초대 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || !['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER'].includes(currentUser.role as UserRole)) {
    return null; // Render nothing if not authorized, useEffect will redirect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">새 계정 초대</h1>

      <Card>
        <CardHeader>
          <CardTitle>계정 정보 입력</CardTitle>
          <CardDescription>초대할 계정의 이메일과 권한을 설정해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 주소 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="invite@example.com" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>권한 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="권한을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.filter(role => {
                          // OPERATION_TOOL_ADMIN은 모든 권한 초대 가능
                          if (currentUser.role === 'OPERATION_TOOL_ADMIN') return true;
                          // BUSINESS_MANAGER는 OPERATOR만 초대 가능
                          if (currentUser.role === 'BUSINESS_MANAGER') return role === 'OPERATOR';
                          return false;
                        }).map(role => (
                          <SelectItem key={role} value={role}>
                            {role === 'OPERATION_TOOL_ADMIN' ? '운영툴 관리자' :
                             role === 'BUSINESS_MANAGER' ? '사업 관리자' :
                             '운영자'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(selectedRole === 'BUSINESS_MANAGER' || selectedRole === 'OPERATOR') && currentUser.role === 'OPERATION_TOOL_ADMIN' && (
                <FormField
                  control={form.control}
                  name="rentalCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>렌탈사 (사업 관리자/운영자용)</FormLabel>
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
                {isLoading ? '초대 중...' : '계정 초대'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
