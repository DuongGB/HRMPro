import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "../api/authApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, { message: "Vui lòng nhập địa chỉ email!" }).email({ message: "Địa chỉ email không đúng định dạng!" }),
});

const ForgotPasswordPage: React.FC = () => {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success("Yêu cầu khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra email của bạn.");
      form.reset();
    },
    onError: (error: any) => {
      let errorMsg = "Gửi yêu cầu thất bại, vui lòng thử lại!";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    forgotMutation.mutate(values.email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-2xl mb-2 shadow-sm">
            H
          </div>
          <CardTitle className="text-2xl font-bold">Quên mật khẩu?</CardTitle>
          <CardDescription>
            Nhập email liên kết với tài khoản của bạn để nhận hướng dẫn khôi phục mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Email công ty hoặc cá nhân" className="pl-9 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 text-base font-medium mt-2"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu khôi phục
              </Button>
            </form>
          </Form>

          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
