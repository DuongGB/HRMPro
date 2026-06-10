import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl transform scale-150 animate-pulse"></div>
        <div className="relative bg-background border border-destructive/20 rounded-full p-6 text-destructive shadow-lg">
          <ShieldAlert size={64} className="animate-bounce" />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground mb-2">
        403 - Không Có Quyền Truy Cập
      </h1>
      
      <p className="max-w-md text-muted-foreground mb-8 text-base">
        Tài khoản của bạn không được cấp quyền để truy cập tài nguyên này. Vui lòng liên hệ với Quản trị hệ thống (IT Support) nếu bạn tin rằng đây là một sự sai sót.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Quay lại trang trước
        </Button>
        <Button onClick={() => navigate("/")} variant="default">
          Về trang chủ Dashboard
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
