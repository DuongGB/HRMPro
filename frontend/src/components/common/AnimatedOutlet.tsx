import React, { useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";

/**
 * Tính "depth" của pathname — dùng để detect hướng navigate.
 * Ví dụ: /employees = 1, /employees/42 = 2
 */
const pathDepth = (pathname: string): number =>
  pathname.split("/").filter(Boolean).length;

/**
 * AnimatedOutlet: giữ lại outlet element cũ trong khi re-mount,
 * đồng thời chọn class animation dựa trên hướng navigate.
 */
const AnimatedOutlet: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();

  // Lưu lại pathname trước đó để so sánh depth
  const prevPathRef = useRef<string>(location.pathname);
  const directionRef = useRef<"forward" | "back">("forward");

  const currentDepth = pathDepth(location.pathname);
  const prevDepth = pathDepth(prevPathRef.current);

  if (prevPathRef.current !== location.pathname) {
    directionRef.current = currentDepth >= prevDepth ? "forward" : "back";
    prevPathRef.current = location.pathname;
  }

  const animClass =
    directionRef.current === "forward" ? "page-enter-forward" : "page-enter-back";

  return (
    <div key={location.pathname} className={animClass}>
      {outlet}
    </div>
  );
};

export default AnimatedOutlet;
