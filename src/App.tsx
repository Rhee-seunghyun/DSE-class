import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Apply from "./pages/Apply";
import Dashboard from "./pages/Dashboard";
import MyLectures from "./pages/MyLectures";
import MyClass from "./pages/MyClass";
import LectureRoom from "./pages/LectureRoom";
import Lectures from "./pages/Lectures";
import LectureEdit from "./pages/LectureEdit";
import Whitelist from "./pages/Whitelist";
import Speakers from "./pages/Speakers";
 import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-class" 
              element={
                <ProtectedRoute allowedRoles={['master', 'speaker']}>
                  <MyClass />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-lectures" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyLectures />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/lecture/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LectureRoom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lectures" 
              element={
                <ProtectedRoute allowedRoles={['speaker']}>
                  <Lectures />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lectures/:id" 
              element={
                <ProtectedRoute allowedRoles={['speaker']}>
                  <LectureEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/whitelist" 
              element={
                <ProtectedRoute allowedRoles={['speaker']}>
                  <Whitelist />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/speakers" 
              element={
                <ProtectedRoute allowedRoles={['master']}>
                  <Speakers />
                </ProtectedRoute>
              } 
            />
             <Route 
               path="/staff" 
               element={
                 <ProtectedRoute allowedRoles={['master']}>
                   <Staff />
                 </ProtectedRoute>
               } 
             />
            <Route path="/apply/:formId" element={<Apply />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
