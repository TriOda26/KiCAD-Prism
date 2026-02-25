import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AuthConfig } from './types/auth';
import { LoginPage } from './components/login-page';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Workspace } from './components/workspace';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import prismLogoMark from './assets/branding/kicad-prism/kicad-prism-icon.svg';



function App() {
    const [user, setUser] = useState<User | null>(() => {
        // Restore user from localStorage on initial load
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('auth_user');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return null;
                }
            }
        }
        return null;
    });
    const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");

    // Fetch auth configuration on mount
    useEffect(() => {
        const fetchAuthConfig = async () => {
            try {
                const res = await fetch('/api/auth/config');
                if (res.ok) {
                    const config = await res.json();
                    setAuthConfig(config);

                    // If auth is disabled, auto-login as guest
                    if (!config.auth_enabled) {
                        const guestUser = { name: 'Guest', email: 'guest@local' };
                        setUser(guestUser);
                        localStorage.setItem('auth_user', JSON.stringify(guestUser));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch auth config:', err);
                // On error, default to no auth (allow access)
                const guestUser = { name: 'Guest', email: 'guest@local' };
                setUser(guestUser);
                localStorage.setItem('auth_user', JSON.stringify(guestUser));
            } finally {
                setLoading(false);
            }
        };

        fetchAuthConfig();
    }, []);

    // Persist user to localStorage when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_user');
        }
    }, [user]);

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    // Show loading state while fetching auth config
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // If auth is enabled and no user, show login page
    if (authConfig?.auth_enabled && !user) {
        // Fallback for missing client ID in config
        if (!authConfig.google_client_id) {
            return (
                <div className="flex items-center justify-center h-screen bg-background">
                    <div className="text-red-500">Error: Missing Google Client ID in backend configuration.</div>
                </div>
            );
        }

        return (
            <GoogleOAuthProvider clientId={authConfig.google_client_id}>
                <LoginPage
                    onLoginSuccess={setUser}
                    devMode={authConfig.dev_mode}
                    workspaceName={authConfig.workspace_name}
                />
            </GoogleOAuthProvider>
        );
    }

    // User is authenticated or auth is disabled - show app
    return (
        <BrowserRouter>
            <Toaster richColors position="top-right" />
            <Routes>
                <Route path="/" element={
                    <div className="min-h-screen bg-background text-foreground">
                        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                            <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 px-3 md:px-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <img src={prismLogoMark} alt="KiCAD Prism Logo" className="h-7 w-7 object-contain" />
                                    <span className="text-xl font-bold tracking-tight text-foreground">KiCAD Prism</span>
                                </div>

                                <div className="flex justify-center">
                                    <div className="relative w-full max-w-2xl">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={workspaceSearchQuery}
                                            onChange={(event) => setWorkspaceSearchQuery(event.target.value)}
                                            placeholder="Search projects by name, description, and metadata"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {user && user.email !== 'guest@local' && (
                                        <>
                                            <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
                                            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
                                        </>
                                    )}
                                    {user && user.email === 'guest@local' && (
                                        <span className="text-sm text-muted-foreground">Viewing as Guest</span>
                                    )}
                                </div>
                            </div>
                        </header>

                        <main className="h-[calc(100vh-4rem)]">
                            <Workspace
                                searchQuery={workspaceSearchQuery}
                            />
                        </main>
                    </div>
                } />
                <Route path="/project/:projectId" element={<ProjectDetailPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
