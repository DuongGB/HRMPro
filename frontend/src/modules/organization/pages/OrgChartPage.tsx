import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi, type DepartmentResponse } from "../api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import { employeeApi, type EmployeeResponse } from "@/modules/employee/api/employeeApi";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Component Đệ quy hiển thị Node Phòng Ban
interface OrgNodeProps {
  node: DepartmentResponse;
  onEdit: (dept: DepartmentResponse) => void;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  onViewEmployees: (deptId: number, deptName: string) => void;
  canManage: boolean;
  searchTerm: string;
}

const OrgNode: React.FC<OrgNodeProps> = ({ node, onEdit, onAddChild, onDelete, onViewEmployees, canManage, searchTerm }) => {
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
      <div 
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) {
            return;
          }
          onViewEmployees(node.id, node.name);
        }}
        className={`relative group flex flex-col items-center bg-card border rounded-xl p-4 shadow-sm min-w-[240px] max-w-[280px] transition-all duration-300 hover:shadow-md cursor-pointer ${
          isMatched 
            ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md scale-105" 
            : "border-border hover:border-primary/50"
        }`}
      >
        
        {/* Nút collapse ở góc dưới nếu có con */}
        {hasChildren && (
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Ngăn chặn sự kiện click lan ra Card cha mở dialog
              setCollapsed(!collapsed);
            }}
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
                  {node.children?.length} nhánh con
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
                  onViewEmployees={onViewEmployees}
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

  // State & Refs quản lý kéo thả sơ đồ cây (Drag-to-Pan)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPanOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Xử lý kéo thả (drag-to-pan)
  const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
    // Chặn kéo thả khi nhấn vào các phần tử tương tác (button, input, link...)
    if (
      target.closest("button") || 
      target.closest("input") || 
      target.closest("a") || 
      target.closest("select") || 
      target.closest("textarea") ||
      target.closest(".no-drag")
    ) {
      return;
    }
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    startPanOffsetRef.current = { ...panOffset };
    hasMovedRef.current = false;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
    }

    // Chia cho zoom để tốc độ kéo 1:1 với con trỏ chuột trên màn hình
    setPanOffset({
      x: startPanOffsetRef.current.x + dx / zoom,
      y: startPanOffsetRef.current.y + dy / zoom,
    });
  };

  const handleEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(0.8);
    setPanOffset({ x: 0, y: 0 });
  };

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

  // States chọn quản lý từ Dialog nhân viên
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeePage, setEmployeePage] = useState(0);
  const [selectedManagerName, setSelectedManagerName] = useState("");

  // States quản lý phòng ban con trực thuộc (Multi-select)
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>([]);
  const [isChildrenDialogOpen, setIsChildrenDialogOpen] = useState(false);

  // States xem danh sách nhân viên thuộc phòng ban
  const [isViewEmployeesOpen, setIsViewEmployeesOpen] = useState(false);
  const [viewDeptId, setViewDeptId] = useState<number | null>(null);
  const [viewDeptName, setViewDeptName] = useState("");
  const [viewDeptPage, setViewDeptPage] = useState(0);

  // Query: Lấy cây phòng ban
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ["department-tree"],
    queryFn: organizationApi.getDepartmentTree,
  });

  // Query: Lấy danh sách nhân viên phục vụ việc chọn quản lý
  const { data: employeeData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees-select-list", employeeSearch, employeePage],
    queryFn: () => employeeApi.getEmployees(employeeSearch, null, "ACTIVE", employeePage, 6),
    enabled: isEmployeeDialogOpen,
  });

  // Query: Lấy danh sách nhân viên của phòng ban được click chọn
  const { data: deptEmployeesData, isLoading: isLoadingDeptEmployees } = useQuery({
    queryKey: ["employees-by-dept", viewDeptId, viewDeptPage],
    queryFn: () => employeeApi.getEmployees("", viewDeptId, "", viewDeptPage, 5),
    enabled: !!viewDeptId && isViewEmployeesOpen,
  });

  const handleViewEmployees = (deptId: number, deptName: string) => {
    if (hasMovedRef.current) return; // Bỏ qua nếu vừa kéo thả sơ đồ
    setViewDeptId(deptId);
    setViewDeptName(deptName);
    setViewDeptPage(0);
    setIsViewEmployeesOpen(true);
  };

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
    setSelectedManagerName("");
    setSelectedChildrenIds([]);
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
    setSelectedManagerName(dept.managerName || "");
    setSelectedChildrenIds(dept.children ? dept.children.map(c => c.id) : []);
    setDescription(dept.description || "");
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    toast.warning(
      "Xác nhận ngừng hoạt động phòng ban?",
      {
        description: "Các phòng ban con và nhân sự trực thuộc sẽ bị ảnh hưởng. Hành động này không thể hoàn tác.",
        action: {
          label: "Ngừng hoạt động",
          onClick: () => deleteMutation.mutate(id),
        },
        cancel: {
          label: "Hủy",
          onClick: () => {},
        },
        duration: 8000,
      }
    );
  };

  const handleSelectEmployee = (emp: EmployeeResponse) => {
    setManagerId(emp.id);
    setSelectedManagerName(emp.fullName);
    setIsEmployeeDialogOpen(false);
  };

  const handleClearManager = () => {
    setManagerId(null);
    setSelectedManagerName("");
  };

  // Lấy danh sách các phòng ban hợp lệ có thể làm cha
  // Loại trừ chính nó và tất cả các phòng ban con cháu trực thuộc của nó để tránh vòng lặp vô hạn
  const getEligibleParentDepts = () => {
    if (!isEditMode || !selectedDept) {
      return allDepts; // Nếu tạo mới, tất cả phòng ban đều có thể làm cha
    }
    
    // Thu thập tất cả các ID của các con cháu trực thuộc
    const descendantIds = new Set<number>();
    const collectDescendants = (deptId: number) => {
      const children = allDepts.filter(d => d.parentId === deptId);
      children.forEach(child => {
        descendantIds.add(child.id);
        collectDescendants(child.id);
      });
    };
    collectDescendants(selectedDept.id);

    return allDepts.filter(
      d => d.id !== selectedDept.id && !descendantIds.has(d.id)
    );
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
      childrenIds: selectedChildrenIds,
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
            Xem và cấu hình phân cấp các phòng ban trong toàn bộ doanh nghiệp (sơ đồ cây hiển thị các cấp quản lý và lãnh đạo).
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
              onClick={handleResetView}
              className="text-[10px] font-semibold text-primary hover:underline ml-1"
              title="Đặt lại mức thu phóng và vị trí sơ đồ"
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
        <div 
          className={`border rounded-xl bg-background shadow-sm p-10 min-h-[550px] overflow-hidden flex justify-center relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={(e) => {
            if (e.button !== 0) return; // Chỉ cho phép kéo bằng chuột trái
            handleStart(e.clientX, e.clientY, e.target as HTMLElement);
          }}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handleEnd}
        >
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
              className="transition-transform duration-75 ease-out flex gap-12 pt-6 items-start origin-top select-none"
              style={{ 
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, 
                minWidth: "max-content" 
              }}
            >
              {tree.map(rootNode => (
                <OrgNode 
                  key={rootNode.id} 
                  node={rootNode} 
                  onEdit={handleEdit} 
                  onAddChild={handleAddChild} 
                  onDelete={handleDelete} 
                  onViewEmployees={handleViewEmployees}
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
                <Card 
                  key={dept.id} 
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) {
                      return;
                    }
                    handleViewEmployees(dept.id, dept.name);
                  }}
                  className="hover:shadow-md transition-all border border-border/60 hover:border-primary/40 relative overflow-hidden group cursor-pointer"
                >
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

            {/* Phòng ban trực thuộc (Cha) */}
            <div className="space-y-1">
              <Label htmlFor="parent-dept">Phòng ban trực thuộc (Cấp trên)</Label>
              <Select
                value={parentId === null ? "none" : parentId.toString()}
                onValueChange={(val) => {
                  setParentId(val === "none" ? null : Number(val));
                }}
                disabled={isEditMode && selectedDept?.code === "DEP-EXEC"} // Ban giám đốc luôn là gốc
              >
                <SelectTrigger id="parent-dept" className="bg-background">
                  <SelectValue placeholder="Chọn phòng ban trực thuộc..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không trực thuộc (Cấp cao nhất / Gốc)</SelectItem>
                  {getEligibleParentDepts().map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quản lý phòng ban (Trưởng phòng)</Label>
              <div className="flex items-center gap-2">
                <div className="grow border rounded-md px-3 py-2 bg-muted/30 text-sm flex items-center justify-between min-h-[40px]">
                  {selectedManagerName ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs">{selectedManagerName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Chưa chọn quản lý</span>
                  )}
                  {managerId && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearManager}
                      className="h-6 px-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Xóa chọn
                    </Button>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEmployeeSearch("");
                    setEmployeePage(0);
                    setIsEmployeeDialogOpen(true);
                  }}
                  className="shrink-0 flex items-center gap-1.5 text-xs h-10"
                >
                  <User size={14} />
                  Chọn nhân viên
                </Button>
              </div>
            </div>

            {isEditMode && (
              <div className="space-y-1.5">
                <Label>Các phòng ban con trực thuộc (Quản lý nhiều)</Label>
                <div className="border rounded-md p-3 bg-muted/10 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChildrenIds.length > 0 ? (
                      selectedChildrenIds.map(childId => {
                        const childDept = allDepts.find(d => d.id === childId);
                        return (
                          <Badge 
                            key={childId} 
                            variant="secondary" 
                            className="text-[10px] px-2 py-0.5 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20"
                          >
                            {childDept ? childDept.name : `ID: ${childId}`}
                            <button
                              type="button"
                              onClick={() => setSelectedChildrenIds(ids => ids.filter(id => id !== childId))}
                              className="text-primary hover:text-destructive transition-colors shrink-0 ml-0.5 font-bold"
                            >
                              ✕
                            </button>
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">Chưa có phòng ban con trực thuộc</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChildrenDialogOpen(true)}
                    className="w-full text-[11px] flex items-center gap-1 h-8"
                  >
                    <Plus size={12} />
                    Quản lý danh sách con
                  </Button>
                </div>
              </div>
            )}

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

      {/* Dialog chọn nhân viên làm quản lý */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn quản lý phòng ban</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn một nhân viên đang hoạt động làm quản lý cho phòng ban này.
            </DialogDescription>
          </DialogHeader>

          {/* Tìm kiếm */}
          <div className="relative my-2 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setEmployeePage(0); // Reset về trang đầu khi search
              }}
              className="pl-9 bg-background"
            />
          </div>

          {/* Danh sách nhân viên */}
          <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-lg">
            {isLoadingEmployees ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải danh sách nhân viên...</p>
              </div>
            ) : !employeeData || employeeData.content.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Không tìm thấy nhân viên nào hoạt động.
              </div>
            ) : (
              <div className="divide-y">
                {employeeData.content.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        {emp.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-semibold text-xs text-foreground truncate">{emp.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] bg-muted border rounded px-1 py-0.2 font-mono font-medium">
                            {emp.employeeCode}
                          </span>
                          {emp.positionName && (
                            <span className="text-[9px] text-primary bg-primary/5 px-1 py-0.2 rounded border border-primary/10">
                              {emp.positionName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectEmployee(emp)}
                      className="h-7 px-2.5 text-[11px]"
                    >
                      Chọn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phân trang */}
          {employeeData && employeeData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t mt-2 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Trang {employeePage + 1} / {employeeData.totalPages} ({employeeData.totalElements} nhân viên)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={employeePage === 0}
                  onClick={() => setEmployeePage((p) => Math.max(0, p - 1))}
                  className="h-7 text-[11px]"
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={employeePage >= employeeData.totalPages - 1}
                  onClick={() => setEmployeePage((p) => p + 1)}
                  className="h-7 text-[11px]"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t mt-3 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEmployeeDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog quản lý danh sách phòng ban con */}
      <Dialog open={isChildrenDialogOpen} onOpenChange={setIsChildrenDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Quản lý phòng ban con trực thuộc</DialogTitle>
            <DialogDescription>
              Chọn các phòng ban làm con trực thuộc phòng ban "{name}".
            </DialogDescription>
          </DialogHeader>

          {/* Chọn tất cả / Bỏ chọn tất cả */}
          <div className="flex items-center justify-between px-1 mb-2 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">
              Danh sách phòng ban ({allDepts.filter(d => d.id !== selectedDept?.id).length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const eligibleIds = allDepts
                    .filter(d => d.id !== selectedDept?.id)
                    .map(d => d.id);
                  setSelectedChildrenIds(eligibleIds);
                }}
                className="text-[11px] text-primary font-medium hover:underline underline-offset-2 transition-colors"
              >
                Chọn tất cả
              </button>
              <span className="text-muted-foreground text-[10px]">|</span>
              <button
                type="button"
                onClick={() => setSelectedChildrenIds([])}
                className="text-[11px] text-muted-foreground font-medium hover:text-destructive hover:underline underline-offset-2 transition-colors"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg p-2 min-h-[250px] divide-y">
            {allDepts
              .filter(d => d.id !== selectedDept?.id) // Loại trừ chính nó
              .map(dept => {
                const isSelected = selectedChildrenIds.includes(dept.id);
                return (
                  <div 
                    key={dept.id} 
                    className="flex items-center space-x-3 py-2 px-2 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`child-dept-${dept.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked: boolean | "indeterminate") => {
                        if (checked) {
                          setSelectedChildrenIds(ids => [...ids, dept.id]);
                        } else {
                          setSelectedChildrenIds(ids => ids.filter(id => id !== dept.id));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`child-dept-${dept.id}`}
                      className="text-xs font-normal cursor-pointer text-left grow leading-snug"
                    >
                      <span className="font-semibold text-foreground block text-xs">{dept.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{dept.code}</span>
                    </Label>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="pt-2 shrink-0">
            <Button type="button" size="sm" onClick={() => setIsChildrenDialogOpen(false)}>
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xem danh sách nhân viên thuộc phòng ban */}
      <Dialog open={isViewEmployeesOpen} onOpenChange={setIsViewEmployeesOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="text-primary h-5 w-5" />
              Thành viên phòng ban: {viewDeptName}
            </DialogTitle>
            <DialogDescription>
              Danh sách nhân sự đang trực thuộc phòng ban này.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
            {isLoadingDeptEmployees ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
                <p className="text-sm text-muted-foreground">Đang tải danh sách nhân viên...</p>
              </div>
            ) : !deptEmployeesData?.content || deptEmployeesData.content.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground italic text-sm">
                Không có nhân viên nào thuộc phòng ban này.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Mã NV</TableHead>
                      <TableHead>Chức danh</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptEmployeesData.content.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                              <AvatarImage src={emp.avatarUrl || ""} alt={emp.fullName} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                {emp.lastName.charAt(0)}{emp.firstName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground text-xs">{emp.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">{emp.employeeCode}</TableCell>
                        <TableCell className="text-xs font-medium text-foreground">{emp.positionName || "Chưa phân chức danh"}</TableCell>
                        <TableCell>
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <div>{emp.email}</div>
                            {emp.phone && <div>{emp.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] font-semibold px-2 py-0.5 border ${
                              emp.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              emp.status === "PROBATION" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              emp.status === "ON_LEAVE" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {emp.status === "ACTIVE" ? "Đang làm việc" :
                             emp.status === "PROBATION" ? "Thử việc" :
                             emp.status === "ON_LEAVE" ? "Nghỉ phép" : "Thôi việc"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Phân trang */}
          {deptEmployeesData && deptEmployeesData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t mt-2 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Trang {viewDeptPage + 1} / {deptEmployeesData.totalPages} ({deptEmployeesData.totalElements} nhân viên)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={viewDeptPage === 0}
                  onClick={() => setViewDeptPage((p) => Math.max(0, p - 1))}
                  className="h-7 text-[11px]"
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={viewDeptPage >= deptEmployeesData.totalPages - 1}
                  onClick={() => setViewDeptPage((p) => p + 1)}
                  className="h-7 text-[11px]"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t mt-3 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsViewEmployeesOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgChartPage;
