import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./navbar";
import { isReactSnapPrerender, scheduleIdle } from "@/lib/prerender";

const Footer = lazy(() => import("./footer"));

const DeferredFooter = () => {
  const { pathname } = useLocation();
  const isPrerendering = isReactSnapPrerender();
  const [showFooter, setShowFooter] = useState(
    isPrerendering || pathname !== "/",
  );

  useEffect(() => {
    if (isPrerendering) {
      setShowFooter(true);
      return;
    }

    if (pathname !== "/") {
      setShowFooter(true);
      return;
    }

    setShowFooter(false);
    const renderFooter = () => setShowFooter(true);
    return scheduleIdle(renderFooter, { delay: 12000, timeout: 3000 });
  }, [isPrerendering, pathname]);

  if (!showFooter) return null;

  return (
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="grow min-h-screen">{children}</main>

      <DeferredFooter />
    </div>
  );
};

export default Layout;
