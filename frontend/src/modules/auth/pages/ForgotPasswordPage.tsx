import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "../api/authApi";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f4f7fb] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.85),rgba(226,232,240,0.72))] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.16),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-blue-500/20" />
      <div className="absolute bottom-8 right-8 hidden h-64 w-64 rounded-[2rem] border border-white/50 bg-white/20 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 lg:block" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ModeToggle className="border border-white/70 bg-white/80 text-slate-700 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl hover:bg-white dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800" />
      </div>

      <section className="relative mx-auto grid min-h-[100dvh] w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
        <div className="hidden lg:block">
          <div className="mb-10 inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">HRMPro</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Human resource management</p>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-5xl font-semibold leading-[1.03] tracking-tight text-slate-950 dark:text-white">
              Lấy lại quyền truy cập mà không gián đoạn công việc.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-200">
              HRMPro gửi hướng dẫn khôi phục qua email liên kết với tài khoản nhân sự của bạn.
            </p>
          </div>

          <div className="mt-10 max-w-xl rounded-2xl border border-white/70 bg-white/65 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85">
            <ShieldCheck className="mb-6 h-6 w-6 text-blue-600 dark:text-blue-300" />
            <p className="text-sm font-semibold">Liên kết có thời hạn</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
              Email khôi phục được kiểm soát tần suất gửi để bảo vệ tài khoản và hệ thống.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[460px]">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-none">HRMPro</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Human resource management</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_28px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/95 sm:p-8">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)] dark:bg-white dark:text-slate-950">
                H
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Quên mật khẩu?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Nhập email liên kết với tài khoản để nhận hướng dẫn khôi phục.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="Email công ty hoặc cá nhân"
                            className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-400"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 active:translate-y-px disabled:opacity-70"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {forgotMutation.isPending ? "Đang gửi yêu cầu" : "Gửi yêu cầu"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-700 underline-offset-4 transition hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-offset-slate-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
