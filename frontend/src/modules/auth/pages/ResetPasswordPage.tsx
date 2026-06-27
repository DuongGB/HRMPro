import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Building2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
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

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" }),
  confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu mới!" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["confirmPassword"],
});

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ token, newPassword }),
    onSuccess: () => {
      toast.success("Khôi phục mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.");
      form.reset();
      navigate("/login");
    },
    onError: (error: any) => {
      let errorMsg = "Đặt lại mật khẩu thất bại, vui lòng thử lại hoặc yêu cầu link mới!";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("Token khôi phục mật khẩu không tìm thấy trong URL!");
      return;
    }
    resetMutation.mutate(values.newPassword);
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
              Tạo mật khẩu mới trong môi trường bảo mật.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-200">
              Hoàn tất khôi phục tài khoản bằng liên kết đã gửi đến email của bạn.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/65 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85">
              <ShieldCheck className="mb-6 h-6 w-6 text-blue-600 dark:text-blue-300" />
              <p className="text-sm font-semibold">Kiểm tra token</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Mỗi liên kết khôi phục chỉ dùng cho phiên đặt lại mật khẩu hợp lệ.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200/70 bg-blue-600 p-5 text-white shadow-[0_22px_80px_rgba(37,99,235,0.28)]">
              <p className="text-4xl font-semibold tracking-tight">6+</p>
              <p className="mt-7 text-sm leading-6 text-blue-50">
                Mật khẩu mới cần tối thiểu 6 ký tự theo cấu hình hiện tại.
              </p>
            </div>
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
                Đặt lại mật khẩu
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Nhập mật khẩu mới cho tài khoản HRMPro của bạn.
              </p>
            </div>

            {!token ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
                    <p className="text-sm font-medium leading-6">
                      Token khôi phục không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại liên kết mới.
                    </p>
                  </div>
                </div>
                <Link
                  to="/forgot-password"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  Yêu cầu liên kết mới
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Mật khẩu mới
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                            <Input
                              type={showNew ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Nhập mật khẩu mới"
                              className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-400"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-offset-slate-900"
                              aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                            >
                              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Xác nhận mật khẩu mới
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                            <Input
                              type={showConfirm ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Nhập lại mật khẩu mới"
                              className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-400"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-offset-slate-900"
                              aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                            >
                              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 active:translate-y-px disabled:opacity-70"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {resetMutation.isPending ? "Đang đặt lại" : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              </Form>
            )}

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

export default ResetPasswordPage;
