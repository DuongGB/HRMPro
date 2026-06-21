import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "../api/authApi";
import type { ChangePasswordRequest } from "../types";

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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Vui lòng nhập mật khẩu hiện tại!" }),
  newPassword: z.string().min(6, { message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" }),
  confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu mới!" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["confirmPassword"],
});

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePwdMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success("Thay đổi mật khẩu thành công!");
      form.reset();
      navigate("/");
    },
    onError: (error: any) => {
      let errorMsg = "Thay đổi mật khẩu thất bại, vui lòng thử lại!";
      if (error.response?.status === 401 || error.message?.includes("401")) {
        errorMsg = "Mật khẩu hiện tại không chính xác!";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    },
  });

  function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    changePwdMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  }

  return (
    <div className="flex justify-center w-full max-w-xl mx-auto">
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Đổi mật khẩu</CardTitle>
          <CardDescription>Vui lòng nhập mật khẩu cũ và mật khẩu mới của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showCurrent ? "text" : "password"}
                          placeholder="Mật khẩu hiện tại"
                          className="pl-9 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                className="w-full mt-6"
                disabled={changePwdMutation.isPending}
              >
                {changePwdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đổi mật khẩu
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
