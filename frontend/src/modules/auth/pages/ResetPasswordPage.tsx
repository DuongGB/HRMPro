import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-2xl mb-2 shadow-sm">
            H
          </div>
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-destructive font-medium text-sm">
                Token khôi phục không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại link khôi phục mật khẩu mới.
              </p>
              <div className="pt-2">
                <Link to="/forgot-password" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Yêu cầu link mới
                </Link>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showNew ? "text" : "password"}
                            placeholder="Mật khẩu mới"
                            className="pl-9 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Xác nhận mật khẩu mới"
                            className="pl-9 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-10 text-base font-medium mt-6"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đặt lại mật khẩu
                </Button>
              </form>
            </Form>
          )}

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

export default ResetPasswordPage;
