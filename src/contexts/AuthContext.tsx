import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, SystemConfig } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_DEPARTMENTS, INITIAL_ADMIN_EMAIL } from '../constants';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  systemConfig: SystemConfig | null;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (year: string) => void;
  loading: boolean;
  isAdmin: boolean;
  isVicePrincipal: boolean;
  isLead: boolean;
  isTeacher: boolean;
  isApproved: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<string>('2026-2027');
  const [loading, setLoading] = useState(true);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        const isSuperAdminEmail = user.email?.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();

        if (!userSnap.exists()) {
          // New user registration
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Giáo viên mới',
            photoURL: user.photoURL || '',
            role: isSuperAdminEmail ? 'admin' : 'teacher',
            departmentId: isSuperAdminEmail ? '' : 'khoi_1',
            departmentName: isSuperAdminEmail ? 'Ban Giám Hiệu' : 'Tổ Khối 1',
            status: isSuperAdminEmail ? 'active' : 'pending',
            phone: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(userDocRef, newProfile);

          if (isSuperAdminEmail) {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              createdAt: new Date().toISOString(),
            });
          }

          setUserProfile(newProfile);
        } else {
          const profileData = userSnap.data() as UserProfile;

          // If this is the initial admin, ensure admin role and admin doc marker
          if (isSuperAdminEmail && (profileData.role !== 'admin' || profileData.status !== 'active')) {
            const upgradedProfile = {
              ...profileData,
              role: 'admin' as const,
              status: 'active' as const,
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, upgradedProfile, { merge: true });
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              createdAt: new Date().toISOString(),
            }, { merge: true });
            setUserProfile(upgradedProfile);
          } else {
            setUserProfile(profileData);
          }
        }

        // Auto-seed default departments and categories if admin
        if (isSuperAdminEmail) {
          bootstrapInitialSchoolData().catch(console.error);
        }
      } catch (err) {
        console.error('Error loading or registering user profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time listener for current user's profile updates (role changes, approvals)
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  // Listen to system settings
  useEffect(() => {
    const configRef = doc(db, 'system_settings', 'general');
    const unsubscribeConfig = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cfg = docSnap.data() as SystemConfig;
          setSystemConfig(cfg);
          if (cfg.currentAcademicYear) {
            setSelectedAcademicYearState(cfg.currentAcademicYear);
          }
        } else {
          const defaultConfig: SystemConfig = {
            schoolName: 'Trường Tiểu học Ba Chúc',
            currentAcademicYear: '2026-2027',
            currentSemester: 'Học kì 1',
            allowSelfRegistration: true,
            updatedAt: new Date().toISOString(),
          };
          setSystemConfig(defaultConfig);
        }
      },
      () => {
        // Fallback default
        setSystemConfig({
          schoolName: 'Trường Tiểu học Ba Chúc',
          currentAcademicYear: '2026-2027',
          currentSemester: 'Học kì 1',
          allowSelfRegistration: true,
          updatedAt: new Date().toISOString(),
        });
      }
    );

    return () => unsubscribeConfig();
  }, []);

  const setSelectedAcademicYear = async (year: string) => {
    setSelectedAcademicYearState(year);
    try {
      const configRef = doc(db, 'system_settings', 'general');
      await setDoc(configRef, { currentAcademicYear: year, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Could not persist academic year to Firestore:', e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Helper roles
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();
  const isVicePrincipal = isAdmin || userProfile?.role === 'vice_principal';
  const isLead = userProfile?.role === 'lead';
  const isTeacher = userProfile?.role === 'teacher';
  const isApproved = isAdmin || userProfile?.status === 'active';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        systemConfig,
        selectedAcademicYear,
        setSelectedAcademicYear,
        loading,
        isAdmin,
        isVicePrincipal,
        isLead,
        isTeacher,
        isApproved,
        signInWithGoogle,
        logout,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Seed initial departments, categories, and school configs if not yet present
async function bootstrapInitialSchoolData() {
  try {
    // 1. Departments
    const depSnap = await getDocs(collection(db, 'departments'));
    if (depSnap.empty) {
      const batch = writeBatch(db);
      for (const dep of DEFAULT_DEPARTMENTS) {
        batch.set(doc(db, 'departments', dep.id), {
          ...dep,
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      console.log('Seeded 5 default departments');
    }

    // 2. Categories
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      await batch.commit();
      console.log('Seeded default categories');
    }

    // 3. System Config
    const configRef = doc(db, 'system_settings', 'general');
    await setDoc(configRef, {
      schoolName: 'Trường Tiểu học Ba Chúc',
      currentAcademicYear: '2025-2026',
      currentSemester: 'Học kì 1',
      allowSelfRegistration: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Bootstrap school data note:', e);
  }
}
