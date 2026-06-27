import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "../api/authApi";
import { useAppDispatch } from "../../../store";
import { loginFailure, loginStart, loginSuccess } from "../../../store/slices/authSlice";
import type { LoginRequest } from "../types";

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

const loginSchema = z.object({
  username: z.string().min(1, { message: "Vui lòng nhập tên đăng nhập!" }),
  password: z.string().min(1, { message: "Vui lòng nhập mật khẩu!" }),
});

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      toast.success("Đăng nhập thành công!");
      navigate("/", { replace: true });
    },
    onError: (error: any) => {
      dispatch(loginFailure());
      
      let errorMsg = "Đăng nhập thất bại, vui lòng thử lại!";
      if (error.response?.status === 401 || error.message?.includes("401")) {
        errorMsg = "Tên đăng nhập hoặc mật khẩu không chính xác!";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
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
              Quản trị nhân sự rõ ràng từ lần đăng nhập đầu tiên.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-200">
              Truy cập hồ sơ, chấm công, nghỉ phép và phê duyệt trong một không gian làm việc bảo mật.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/65 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85">
              <ShieldCheck className="mb-6 h-6 w-6 text-blue-600 dark:text-blue-300" />
              <p className="text-sm font-semibold">Bảo vệ phiên làm việc</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Xác thực token và giới hạn thử sai giúp giảm rủi ro truy cập trái phép.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200/70 bg-blue-600 p-5 text-white shadow-[0_22px_80px_rgba(37,99,235,0.28)]">
              <p className="text-4xl font-semibold tracking-tight">24/7</p>
              <p className="mt-7 text-sm leading-6 text-blue-50">
                Sẵn sàng cho đội ngũ HR, quản lý và nhân viên ở mọi ca làm việc.
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
                Chào mừng trở lại
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Đăng nhập để tiếp tục vào hệ thống quản trị nhân sự.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tên đăng nhập
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                          <Input
                            autoComplete="username"
                            placeholder="Nhập tên đăng nhập"
                            className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-400"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Mật khẩu
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Nhập mật khẩu"
                            className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-400"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-offset-slate-900"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-700 underline-offset-4 transition hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-offset-slate-900"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 active:translate-y-px disabled:opacity-70"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loginMutation.isPending ? "Đang đăng nhập" : "Đăng nhập"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
