import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi, type DepartmentResponse } from "../api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import { 
  Building2, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Network,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Component Đệ quy hiển thị Node Phòng Ban
interface OrgNodeProps {
  node: DepartmentResponse;
  onEdit: (dept: DepartmentResponse) => void;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  canManage: boolean;
  searchTerm: string;
}

const OrgNode: React.FC<OrgNodeProps> = ({ node, onEdit, onAddChild, onDelete, canManage, searchTerm }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Highlight nếu trùng khớp search term
  const isMatched = searchTerm && (
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.managerName && node.managerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Tự động mở rộng nếu con của node này khớp với search term
  React.useEffect(() => {
    if (searchTerm) {
      const hasMatchedChild = (n: DepartmentResponse): boolean => {
        if (!n.children) return false;
        return n.children.some(child => 
          child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          child.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hasMatchedChild(child)
        );
      };
      if (hasMatchedChild(node)) {
        setCollapsed(false);
      }
    }
  }, [searchTerm, node]);

  return (
    <div className="flex flex-col items-center">
      {/* Khối Phòng Ban Card */}
      <div className={`relative group flex flex-col items-center bg-card border rounded-xl p-4 shadow-sm min-w-[240px] max-w-[280px] transition-all duration-300 hover:shadow-md ${
        isMatched 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md scale-105" 
          : "border-border hover:border-primary/50"
      }`}>
        
        {/* Nút collapse ở góc dưới nếu có con */}
        {hasChildren && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm z-10"
          >
            {collapsed ? <ChevronRight size={12} className="transition-transform" /> : <ChevronDown size={12} className="transition-transform" />}
          </button>
        )}

        {/* Nội dung Node */}
        <div className="flex items-start gap-3 w-full mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isMatched ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          }`}>
            <Building2 size={20} />
          </div>
          <div className="truncate w-full text-left space-y-1">
            <h4 className="font-bold text-foreground truncate text-sm leading-tight" title={node.name}>
              {node.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] bg-muted text-muted-foreground border rounded px-1.5 py-0.5 font-mono font-semibold">
                {node.code}
              </span>
              {hasChildren && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal">
                  {node.children.length} nhánh con
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin Quản lý */}
        <div className="flex items-center gap-2 w-full text-xs text-muted-foreground border-t pt-2.5 mt-1 bg-transparent">
          <User size={14} className="text-muted-foreground/60 shrink-0" />
          <span className="truncate w-full text-left">
            {node.managerName ? (
              <span className="font-semibold text-foreground">{node.managerName}</span>
            ) : (
              <span className="italic text-muted-foreground/40 font-light">Chưa có Trưởng phòng</span>
            )}
          </span>
        </div>

        {/* Nút thao tác nhanh khi Hover */}
        {canManage && (
          <div className="absolute -top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-background border rounded-lg p-1 shadow-md z-20">
            <button 
              onClick={() => onAddChild(node.id)}
              className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
              title="Thêm phòng ban con"
            >
              <Plus size={13} className="stroke-[2.5]" />
            </button>
            <button 
              onClick={() => onEdit(node)}
              className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 transition-colors"
              title="Sửa phòng ban"
            >
              <Edit size={13} className="stroke-[2.5]" />
            </button>
            <button 
              onClick={() => onDelete(node.id)}
              className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              title="Xóa phòng ban"
              disabled={node.code === "DEP-EXEC"} // Khóa không cho xóa ban giám đốc
            >
              <Trash2 size={13} className="stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Rào nối và các Node Con */}
      {hasChildren && !collapsed && (
        <div className="relative pt-6 flex gap-6">
          {/* Đường kẻ đứng nối xuống con */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-6 bg-muted-foreground/30"></div>
          
          {node.children!.map((child, idx) => (
            <div key={child.id} className="relative">
              {/* Đường kẻ ngang nối các con */}
              {node.children!.length > 1 && (
                <div 
                  className="absolute top-0 h-[1.5px] bg-muted-foreground/30"
                  style={{
                    left: idx === 0 ? "50%" : "0",
                    right: idx === node.children!.length - 1 ? "50%" : "0",
                  }}
                ></div>
              )}
              {/* Nối đứng từ ngang xuống node con */}
              {node.children!.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-6 bg-muted-foreground/30"></div>
              )}
              <div className="pt-6">
                <OrgNode 
                  node={child} 
                  onEdit={onEdit} 
                  onAddChild={onAddChild} 
                  onDelete={onDelete} 
                  canManage={canManage}
                  searchTerm={searchTerm}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChartPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermission();
  const canManage = hasAnyRole(["SUPER_ADMIN", "HR_ADMIN"]);

  // State cấu hình hiển thị
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [zoom, setZoom] = useState<number>(0.8);
  const [search, setSearch] = useState("");

  // State Dialog
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentResponse | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [description, setDescription] = useState("");

  // Query: Lấy cây phòng ban
  const { data: tree = [], isLoading, refetch } = useQuery({
    queryKey: ["department-tree"],
    queryFn: organizationApi.getDepartmentTree,
  });

  // Mutation: Tạo mới phòng ban
  const createMutation = useMutation({
    mutationFn: organizationApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-tree"] });
      toast.success("Tạo phòng ban mới thành công!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Tạo phòng ban thất bại!");
    }
  });

  // Mutation: Cập nhật phòng ban
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      organizationApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-tree"] });
      toast.success("Cập nhật thông tin thành công!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật thất bại!");
    }
  });

  // Mutation: Xóa phòng ban
  const deleteMutation = useMutation({
    mutationFn: organizationApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-tree"] });
      toast.success("Đã ngừng hoạt động phòng ban!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể ngừng hoạt động phòng ban này!");
    }
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setParentId(null);
    setManagerId(null);
    setDescription("");
    setSelectedDept(null);
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    resetForm();
    setIsOpen(true);
  };

  const handleAddChild = (pid: number) => {
    setIsEditMode(false);
    resetForm();
    setParentId(pid);
    setIsOpen(true);
  };

  const handleEdit = (dept: DepartmentResponse) => {
    setIsEditMode(true);
    setSelectedDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setParentId(dept.parentId);
    setManagerId(dept.managerId);
    setDescription(dept.description || "");
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn ngừng hoạt động phòng ban này không? Các phòng ban con và nhân sự trực thuộc sẽ bị ảnh hưởng.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      toast.error("Vui lòng điền mã và tên phòng ban");
      return;
    }

    const payload = {
      code,
      name,
      parentId,
      managerId,
      description,
    };

    if (isEditMode && selectedDept) {
      updateMutation.mutate({ id: selectedDept.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Helper để phẳng hóa cây phòng ban phục vụ Grid View
  const flattenDepartments = (nodes: DepartmentResponse[]): DepartmentResponse[] => {
    const result: DepartmentResponse[] = [];
    const traverse = (node: DepartmentResponse) => {
      result.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return result;
  };

  const allDepts = flattenDepartments(tree);
  const filteredDepts = allDepts.filter(dept => 
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.code.toLowerCase().includes(search.toLowerCase()) ||
    (dept.managerName && dept.managerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sơ đồ tổ chức</h2>
          <p className="text-muted-foreground">
            Xem và cấu hình phân cấp các phòng ban trong toàn bộ doanh nghiệp.
          </p>
        </div>
        
        {canManage && (
          <Button onClick={handleOpenAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Thêm phòng ban gốc
          </Button>
        )}
      </div>

      {/* Toolbar lọc, zoom và view mode */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-card border rounded-xl p-4 shadow-sm justify-between">
        {/* Input Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm phòng ban..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        {/* Zoom Controls (Chỉ hiện khi xem dạng Sơ đồ Cây) */}
        {viewMode === "tree" && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-center bg-muted/40 px-4 py-1.5 rounded-lg border">
            <button 
              onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut size={16} />
            </button>
            <input 
              type="range" 
              min="0.4" 
              max="1.2" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 cursor-pointer accent-primary h-1 bg-border rounded-lg appearance-none"
            />
            <button 
              onClick={() => setZoom(z => Math.min(1.2, z + 0.1))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Phóng to"
            >
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-mono font-semibold text-muted-foreground w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(0.8)}
              className="text-[10px] font-semibold text-primary hover:underline ml-1"
            >
              Đặt lại
            </button>
          </div>
        )}

        {/* View Mode Select Buttons */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/20 shrink-0">
          <Button 
            variant={viewMode === "tree" ? "secondary" : "ghost"} 
            size="sm" 
            className="flex items-center gap-1.5 text-xs px-3 h-8"
            onClick={() => setViewMode("tree")}
          >
            <Network size={14} />
            Sơ đồ cây
          </Button>
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            className="flex items-center gap-1.5 text-xs px-3 h-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={14} />
            Danh sách lưới
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      {viewMode === "tree" ? (
        <div className="border rounded-xl bg-background shadow-sm p-10 min-h-[550px] overflow-auto flex justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải sơ đồ tổ chức...</p>
            </div>
          ) : tree.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Chưa có phòng ban nào được thiết lập.
            </div>
          ) : (
            <div 
              className="transition-transform duration-200 ease-out flex gap-12 pt-6 items-start origin-top"
              style={{ transform: `scale(${zoom})`, minWidth: "max-content" }}
            >
              {tree.map(rootNode => (
                <OrgNode 
                  key={rootNode.id} 
                  node={rootNode} 
                  onEdit={handleEdit} 
                  onAddChild={handleAddChild} 
                  onDelete={handleDelete} 
                  canManage={canManage}
                  searchTerm={search}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grid View Mode */
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 border rounded-xl bg-background">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải danh sách...</p>
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border rounded-xl bg-background">
              Không tìm thấy phòng ban nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepts.map(dept => (
                <Card key={dept.id} className="hover:shadow-md transition-all border border-border/60 hover:border-primary/40 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-3 pl-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-bold text-foreground leading-snug">{dept.name}</CardTitle>
                        <CardDescription className="font-mono text-xs text-primary font-medium">{dept.code}</CardDescription>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building2 size={16} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3.5 pl-6 text-sm">
                    {/* Parent Department info */}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="font-semibold text-foreground shrink-0">Trực thuộc:</span>
                      <span className="truncate">
                        {dept.parentName ? (
                          <Badge variant="outline" className="text-[10px] py-0.5 px-2 font-normal">
                            {dept.parentName}
                          </Badge>
                        ) : (
                          <span className="italic text-[10px] text-muted-foreground/50">Phòng ban cấp cao nhất (Gốc)</span>
                        )}
                      </span>
                    </div>

                    {/* Manager info */}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="font-semibold text-foreground shrink-0">Trưởng phòng:</span>
                      <span className="flex items-center gap-1 text-foreground truncate">
                        <User size={13} className="text-muted-foreground/60" />
                        {dept.managerName ? (
                          <span className="font-medium">{dept.managerName}</span>
                        ) : (
                          <span className="italic text-muted-foreground/40 font-light">Chưa có Trưởng phòng</span>
                        )}
                      </span>
                    </div>

                    {/* Description */}
                    {dept.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-md border border-muted/10">
                        {dept.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    {canManage && (
                      <div className="flex items-center justify-end gap-2 border-t pt-3.5 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 text-xs flex items-center gap-1 hover:text-primary"
                          onClick={() => handleAddChild(dept.id)}
                        >
                          <Plus size={13} />
                          Thêm con
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 text-xs flex items-center gap-1 text-amber-500 hover:text-amber-600 hover:bg-amber-500/5"
                          onClick={() => handleEdit(dept)}
                        >
                          <Edit size={13} />
                          Sửa
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 text-xs flex items-center gap-1 text-destructive hover:text-destructive/90 hover:bg-destructive/5"
                          disabled={dept.code === "DEP-EXEC"}
                          onClick={() => handleDelete(dept.id)}
                        >
                          <Trash2 size={13} />
                          Ngừng HĐ
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog Form Thêm/Sửa */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}</DialogTitle>
            <DialogDescription>
              Điền các thông tin để cấu hình hoặc thay đổi phòng ban của hệ thống.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dept-code">Mã phòng ban</Label>
                <Input 
                  id="dept-code" 
                  placeholder="Ví dụ: DEP-HR..." 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isEditMode && selectedDept?.code === "DEP-EXEC"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dept-name">Tên phòng ban</Label>
                <Input 
                  id="dept-name" 
                  placeholder="Ví dụ: Phòng Nhân Sự..." 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Mã phòng ban cha</Label>
              <Input 
                value={parentId ? `Phòng ban ID: ${parentId}` : "Phòng ban gốc"} 
                disabled 
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept-manager">ID quản lý phòng ban (Manager Employee ID)</Label>
              <Input 
                id="dept-manager" 
                type="number"
                placeholder="ID nhân viên..." 
                value={managerId || ""}
                onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept-desc">Mô tả phòng ban</Label>
              <Textarea 
                id="dept-desc" 
                placeholder="Nhập mô tả phòng ban..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu phòng ban
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgChartPage;
