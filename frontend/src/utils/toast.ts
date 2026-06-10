import { toast } from "sonner";

export const toastUtil = {
  success: (message: string) => {
    toast.success(message);
  },
  error: (message: string) => {
    toast.error(message || "Có lỗi xảy ra, vui lòng thử lại!");
  },
  info: (message: string) => {
    toast.info(message);
  },
  warning: (message: string) => {
    toast.warning(message);
  },
  /**
   * Hiển thị toast confirm cho các hành động quan trọng như Xóa.
   */
  confirm: (
    message: string,
    onConfirm: () => void,
    options?: {
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
    }
  ) => {
    toast.warning(message, {
      description: options?.description || "Hành động này không thể hoàn tác.",
      action: {
        label: options?.confirmLabel || "Xác nhận",
        onClick: () => {
          onConfirm();
        },
      },
      cancel: {
        label: options?.cancelLabel || "Hủy",
        onClick: () => {},
      },
      duration: 8000,
    });
  },
};
export default toastUtil;
