/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SchoolDocument, Department, DocumentCategory, UserProfile } from './types';
import { DEFAULT_DEPARTMENTS, DEFAULT_CATEGORIES } from './constants';

import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { DashboardView } from './views/DashboardView';
import { SubmissionPortalView } from './views/SubmissionPortalView';
import { DocumentListView } from './views/DocumentListView';
import { RemindersView } from './views/RemindersView';
import { ReportsView } from './views/ReportsView';
import { DepartmentsView } from './views/DepartmentsView';
import { CategoriesView } from './views/CategoriesView';
import { UserManagementView } from './views/UserManagementView';
import { AdminGuideView } from './views/AdminGuideView';
import { DocumentDetailModal } from './views/DocumentDetailModal';
import { School } from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, loading, isApproved, isAdmin, isVicePrincipal, isLead } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Core data states
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [categories, setCategories] = useState<DocumentCategory[]>(DEFAULT_CATEGORIES);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Directly opened document modal from notification or quick view
  const [selectedDocForModal, setSelectedDocForModal] = useState<SchoolDocument | null>(null);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Real-time listener for Documents
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const docsRef = collection(db, 'documents');
    const q = query(docsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...(d.data() as SchoolDocument), id: d.id }));
        setDocuments(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'documents');
      }
    );

    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger]);

  // Real-time listener for Departments
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const depRef = collection(db, 'departments');
    const unsubscribe = onSnapshot(
      depRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => ({ ...(d.data() as Department), id: d.id }));
          // Sort 1 to 5
          items.sort((a, b) => (a.gradeNumber || 0) - (b.gradeNumber || 0));
          setDepartments(items);
        }
      },
      () => {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger]);

  // Real-time listener for Categories
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const catRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      catRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => ({ ...(d.data() as DocumentCategory), id: d.id }));
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategories(items);
        }
      },
      () => {
        setCategories(DEFAULT_CATEGORIES);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger]);

  // Real-time listener for Users
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
        setUsers(items);
      },
      (error) => {
        console.warn('Users list note:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger]);

  // Handle open document by ID (e.g. from notification)
  const handleOpenDocById = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (target) {
      setSelectedDocForModal(target);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100/80 via-sky-100/70 to-indigo-100/80 flex flex-col items-center justify-center text-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 flex items-center justify-center shadow-lg shadow-purple-200/50 animate-pulse mb-3.5">
          <School className="w-8 h-8 text-amber-200" />
        </div>
        <p className="text-sm font-bold text-purple-950">Đang khởi tạo hệ thống hồ sơ số...</p>
        <p className="text-xs text-purple-600/80 mt-1">Trường Tiểu Học Ba Chúc • 5 Tổ Khối Chuyên Môn</p>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!currentUser) {
    return <LoginView />;
  }

  // Pending approval -> Show Pending screen
  if (!isApproved) {
    return <PendingApprovalView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/60 via-sky-50/40 to-purple-50/40 flex flex-col font-sans text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          onSelectDocument={handleOpenDocById}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              documents={documents}
              departments={departments}
              categories={categories}
              onOpenSubmit={() => setActiveTab('submit')}
              onSelectDocument={(doc) => setSelectedDocForModal(doc)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'submit' && (
            <SubmissionPortalView
              departments={departments}
              categories={categories}
              onSuccess={(newDocId) => {
                triggerRefresh();
                setActiveTab('documents');
              }}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentListView
              documents={documents}
              departments={departments}
              categories={categories}
              onOpenSubmit={() => setActiveTab('submit')}
              onRefresh={triggerRefresh}
              initialSelectedDoc={selectedDocForModal}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              documents={documents}
              departments={departments}
              users={users}
              onSelectDocument={(doc) => setSelectedDocForModal(doc)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              documents={documents}
              departments={departments}
              users={users}
              categories={categories}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsView
              departments={departments}
              users={users}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              departments={departments}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'guide' && <AdminGuideView />}
        </main>
      </div>

      {/* Floating Modal if a document was selected */}
      {selectedDocForModal && (
        <DocumentDetailModal
          document={selectedDocForModal}
          onClose={() => setSelectedDocForModal(null)}
          onRefresh={triggerRefresh}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
