import { NextRequest, NextResponse } from 'next/server';

interface ProjectConfig {
  language: 'typescript' | 'javascript';
  useTailwind: boolean;
  useEmotion: boolean;
  uiLibrary: 'shadcn' | 'mantine' | 'none';
  validation: 'zod' | 'yup' | 'none';
  stateManagement: 'zustand' | 'redux' | 'none';
  database: 'prisma' | 'drizzle' | 'none';
  authentication: 'nextauth' | 'clerk' | 'none';
  testing: 'jest' | 'vitest' | 'none';
  includeLoginPage: boolean;
}

// Cache for npm package versions to avoid repeated API calls
const packageVersionCache: Record<string, string> = {};

async function getLatestPackageVersion(packageName: string): Promise<string> {
  // Check cache first
  if (packageVersionCache[packageName]) {
    return packageVersionCache[packageName];
  }

  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const version = `^${data.version}`;
      packageVersionCache[packageName] = version;
      console.log(`📦 Fetched latest version for ${packageName}: ${version}`);
      return version;
    }
  } catch (error) {
    console.warn(`Failed to fetch latest version for ${packageName}, using 'latest'`, error);
  }
  
  // Fallback to 'latest' if API call fails
  packageVersionCache[packageName] = 'latest';
  return 'latest';
}

async function generatePackageJsonDependencies(config: ProjectConfig) {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  // Base Next.js dependencies (already in template)
  // dependencies['next'] = await getLatestPackageVersion('next');
  // dependencies['react'] = await getLatestPackageVersion('react');
  // dependencies['react-dom'] = await getLatestPackageVersion('react-dom');

  if (config.language === 'typescript') {
    devDependencies['@types/node'] = await getLatestPackageVersion('@types/node');
    devDependencies['@types/react'] = await getLatestPackageVersion('@types/react');
    devDependencies['@types/react-dom'] = await getLatestPackageVersion('@types/react-dom');
    devDependencies['typescript'] = await getLatestPackageVersion('typescript');
  }

  if (config.useTailwind) {
    devDependencies['tailwindcss'] = await getLatestPackageVersion('tailwindcss');
    devDependencies['postcss'] = await getLatestPackageVersion('postcss');
    devDependencies['autoprefixer'] = await getLatestPackageVersion('autoprefixer');
  }

  if (config.useEmotion) {
    dependencies['@emotion/react'] = await getLatestPackageVersion('@emotion/react');
    dependencies['@emotion/styled'] = await getLatestPackageVersion('@emotion/styled');
  }

  if (config.uiLibrary === 'shadcn') {
    dependencies['@radix-ui/react-slot'] = await getLatestPackageVersion('@radix-ui/react-slot');
    dependencies['class-variance-authority'] = await getLatestPackageVersion('class-variance-authority');
    dependencies['clsx'] = await getLatestPackageVersion('clsx');
    dependencies['tailwind-merge'] = await getLatestPackageVersion('tailwind-merge');
    devDependencies['lucide-react'] = await getLatestPackageVersion('lucide-react');
  } else if (config.uiLibrary === 'mantine') {
    dependencies['@mantine/core'] = await getLatestPackageVersion('@mantine/core');
    dependencies['@mantine/hooks'] = await getLatestPackageVersion('@mantine/hooks');
  }

  if (config.validation === 'zod') {
    dependencies['zod'] = await getLatestPackageVersion('zod');
  } else if (config.validation === 'yup') {
    dependencies['yup'] = await getLatestPackageVersion('yup');
  }

  if (config.stateManagement === 'zustand') {
    dependencies['zustand'] = await getLatestPackageVersion('zustand');
  } else if (config.stateManagement === 'redux') {
    dependencies['@reduxjs/toolkit'] = await getLatestPackageVersion('@reduxjs/toolkit');
    dependencies['react-redux'] = await getLatestPackageVersion('react-redux');
  }

  if (config.database === 'prisma') {
    dependencies['@prisma/client'] = await getLatestPackageVersion('@prisma/client');
    devDependencies['prisma'] = await getLatestPackageVersion('prisma');
  } else if (config.database === 'drizzle') {
    dependencies['drizzle-orm'] = await getLatestPackageVersion('drizzle-orm');
    devDependencies['drizzle-kit'] = await getLatestPackageVersion('drizzle-kit');
  }

  if (config.authentication === 'nextauth') {
    dependencies['next-auth'] = await getLatestPackageVersion('next-auth');
  } else if (config.authentication === 'clerk') {
    dependencies['@clerk/nextjs'] = await getLatestPackageVersion('@clerk/nextjs');
  }

  if (config.testing === 'jest') {
    devDependencies['jest'] = await getLatestPackageVersion('jest');
    devDependencies['@testing-library/react'] = await getLatestPackageVersion('@testing-library/react');
    devDependencies['@testing-library/jest-dom'] = await getLatestPackageVersion('@testing-library/jest-dom');
    devDependencies['jest-environment-jsdom'] = await getLatestPackageVersion('jest-environment-jsdom');
  } else if (config.testing === 'vitest') {
    devDependencies['vitest'] = await getLatestPackageVersion('vitest');
    devDependencies['@testing-library/react'] = await getLatestPackageVersion('@testing-library/react');
    devDependencies['@testing-library/jest-dom'] = await getLatestPackageVersion('@testing-library/jest-dom');
    devDependencies['jsdom'] = await getLatestPackageVersion('jsdom');
  }

  return { dependencies, devDependencies };
}

async function createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, token: string) {
  // First, try to get the file to check if it exists
  let sha: string | undefined;
  try {
    const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });
    
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }
  } catch {
    // File doesn't exist, that's ok
  }

  // Create or update the file
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      ...(sha && { sha }),
    }),
  });

  return response;
}

async function customizeRepository(owner: string, repo: string, config: ProjectConfig, token: string) {
  console.log('🔍 Starting customizeRepository for:', owner, repo);
  const { dependencies, devDependencies } = await generatePackageJsonDependencies(config);
  
  console.log('📦 Generated dependencies:', JSON.stringify(dependencies, null, 2));
  console.log('🛠️ Generated devDependencies:', JSON.stringify(devDependencies, null, 2));
  
  // Update package.json with new dependencies
  if (Object.keys(dependencies).length > 0 || Object.keys(devDependencies).length > 0) {
    console.log('⚙️ Updating package.json...');
    // Get current package.json
    const pkgResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (pkgResponse.ok) {
      const pkgData = await pkgResponse.json();
      const currentPkg = JSON.parse(Buffer.from(pkgData.content, 'base64').toString());

      // Merge dependencies
      const updatedPkg = {
        ...currentPkg,
        dependencies: { ...currentPkg.dependencies, ...dependencies },
        devDependencies: { ...currentPkg.devDependencies, ...devDependencies },
      };

      const updateResponse = await createOrUpdateFile(
        owner,
        repo,
        'package.json',
        JSON.stringify(updatedPkg, null, 2),
        `feat: add ${Object.keys(dependencies).concat(Object.keys(devDependencies)).join(', ')} dependencies`,
        token
      );
      
      console.log('📝 Package.json update response status:', updateResponse.status);
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('❌ Package.json update failed:', errorData);
        throw new Error(`Failed to update package.json: ${errorData.message || 'Unknown error'}`);
      } else {
        console.log('✅ Package.json updated successfully');
      }
    }
  }

  // Create configuration files based on selections
  if (config.useTailwind) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

    await createOrUpdateFile(
      owner,
      repo,
      'tailwind.config.js',
      tailwindConfig,
      'feat: add Tailwind CSS configuration',
      token
    );

    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

    await createOrUpdateFile(
      owner,
      repo,
      'postcss.config.js',
      postcssConfig,
      'feat: add PostCSS configuration for Tailwind',
      token
    );
  }

  // Create Emotion configuration if selected
  if (config.useEmotion) {
    const emotionConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    emotion: true,
  },
}

module.exports = nextConfig`;

    // Update next.config if it doesn't exist, or extend it if it does
    await createOrUpdateFile(
      owner,
      repo,
      'next.config.js',
      emotionConfig,
      'feat: add Emotion configuration',
      token
    );

    // Create emotion theme example
    const emotionTheme = `export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      900: '#0f172a',
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
}

export type Theme = typeof theme`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_styles/theme.ts',
      emotionTheme,
      'feat: add Emotion theme configuration',
      token
    );
  }

  // Add TypeScript configuration if selected
  if (config.language === 'typescript') {
    const tsConfig = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;

    await createOrUpdateFile(
      owner,
      repo,
      'tsconfig.json',
      tsConfig,
      'feat: add TypeScript configuration',
      token
    );
  }

  // Add testing configuration
  if (config.testing === 'jest') {
    const jestConfig = `const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)`;

    await createOrUpdateFile(
      owner,
      repo,
      'jest.config.js',
      jestConfig,
      'feat: add Jest configuration',
      token
    );

    const jestSetup = `import '@testing-library/jest-dom'`;

    await createOrUpdateFile(
      owner,
      repo,
      'jest.setup.js',
      jestSetup,
      'feat: add Jest setup file',
      token
    );
  } else if (config.testing === 'vitest') {
    const vitestConfig = `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})`;

    await createOrUpdateFile(
      owner,
      repo,
      'vitest.config.ts',
      vitestConfig,
      'feat: add Vitest configuration',
      token
    );

    const vitestSetup = `import '@testing-library/jest-dom'`;

    await createOrUpdateFile(
      owner,
      repo,
      'vitest.setup.ts',
      vitestSetup,
      'feat: add Vitest setup file',
      token
    );
  }

  // Create example state management files
  if (config.stateManagement === 'zustand') {
    const zustandStore = `import { create } from 'zustand'

interface AppState {
  count: number
  increment: () => void
  decrement: () => void
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))`;

    await createOrUpdateFile(
      owner,
      repo,
      'lib/store.ts',
      zustandStore,
      'feat: add Zustand store example',
      token
    );
  } else if (config.stateManagement === 'redux') {
    const reduxStore = `import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_stores/store.ts',
      reduxStore,
      'feat: add Redux store configuration',
      token
    );

    const counterSlice = `import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions
export default counterSlice.reducer`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_stores/counterSlice.ts',
      counterSlice,
      'feat: add Redux counter slice example',
      token
    );
  }

  // Generate login page and authentication logic
  if (config.includeLoginPage) {
    console.log('🔐 Generating login page and authentication logic...');
    
    // Create auth utilities based on state management
    if (config.stateManagement === 'zustand') {
      await generateZustandAuthLogic(owner, repo, config, token);
    } else if (config.stateManagement === 'redux') {
      await generateReduxAuthLogic(owner, repo, config, token);
    } else {
      await generateBasicAuthLogic(owner, repo, config, token);
    }
    
    // Generate login component
    await generateLoginComponent(owner, repo, config, token);
    
    console.log('✅ Login page and authentication logic generated');
  }

  // Generate validation schemas if selected
  if (config.validation !== 'none') {
    console.log(`🔍 Generating ${config.validation} validation schemas...`);
    await generateValidationSchemas(owner, repo, config, token);
    console.log('✅ Validation schemas generated');
  }

  return true;
}

async function generateValidationSchemas(owner: string, repo: string, config: ProjectConfig, token: string) {
  if (config.validation === 'zod') {
    const authValidation = `import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type User = z.infer<typeof userSchema>`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_validations/auth.ts',
      authValidation,
      'feat: add Zod authentication validation schemas',
      token
    );

    const commonValidation = `import { z } from 'zod'

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters')
export const phoneSchema = z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number')

// Generic form validation
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactForm = z.infer<typeof contactSchema>`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_validations/common.ts',
      commonValidation,
      'feat: add common Zod validation schemas',
      token
    );

  } else if (config.validation === 'yup') {
    const authValidation = `import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export const registerSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], "Passwords don't match"),
})

export const userSchema = yup.object({
  id: yup.string().required(),
  email: yup.string().email().required(),
  name: yup.string(),
  createdAt: yup.date(),
  updatedAt: yup.date(),
})

export type LoginForm = yup.InferType<typeof loginSchema>
export type RegisterForm = yup.InferType<typeof registerSchema>
export type User = yup.InferType<typeof userSchema>`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_validations/auth.ts',
      authValidation,
      'feat: add Yup authentication validation schemas',
      token
    );

    const commonValidation = `import * as yup from 'yup'

// Common validation patterns
export const emailSchema = yup.string().email('Invalid email address')
export const passwordSchema = yup.string().min(6, 'Password must be at least 6 characters')
export const nameSchema = yup.string().min(2, 'Name must be at least 2 characters')
export const phoneSchema = yup.string().matches(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number')

// Generic form validation
export const contactSchema = yup.object({
  name: nameSchema.required('Name is required'),
  email: emailSchema.required('Email is required'),
  message: yup.string().min(10, 'Message must be at least 10 characters').required('Message is required'),
})

export type ContactForm = yup.InferType<typeof contactSchema>`;

    await createOrUpdateFile(
      owner,
      repo,
      'app/_validations/common.ts',
      commonValidation,
      'feat: add common Yup validation schemas',
      token
    );
  }
}

async function generateZustandAuthLogic(owner: string, repo: string, config: ProjectConfig, token: string) {
  // Generate types file first
  const authTypes = `export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_types/auth.ts',
    authTypes,
    'feat: add authentication types',
    token
  );

  const authStore = `import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState } from '../_types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Replace this with your actual API call
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          
          if (response.ok) {
            const { user, token } = await response.json()
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            })
            
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Clear token from API calls
        // You might want to call your logout API here
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
      
      setToken: (token: string) => {
        set({ token })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_stores/auth-store.ts',
    authStore,
    'feat: add Zustand authentication store',
    token
  );

  // Generate API client
  const apiClient = `import { useAuthStore } from '../_stores/auth-store'

export const apiClient = {
  get: async (url: string) => {
    const { token } = useAuthStore.getState()
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
  
  post: async (url: string, data: any) => {
    const { token } = useAuthStore.getState()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  put: async (url: string, data: any) => {
    const { token } = useAuthStore.getState()
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  delete: async (url: string) => {
    const { token } = useAuthStore.getState()
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_api/client.ts',
    apiClient,
    'feat: add API client with authentication',
    token
  );

  // Note: zustand dependency is already handled in generatePackageJsonDependencies
  // No need to manually add it here since we're getting the latest version automatically
}

async function generateReduxAuthLogic(owner: string, repo: string, config: ProjectConfig, token: string) {
  // Generate types file first (if not already created)
  const authTypes = `export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_types/auth.ts',
    authTypes,
    'feat: add authentication types',
    token
  );

  const authSlice = `import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { User, AuthState } from '../_types/auth'

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth-token'),
  isAuthenticated: !!localStorage.getItem('auth-token'),
  isLoading: false,
  error: null,
}

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Replace this with your actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('auth-token', data.token)
        return data
      } else {
        const error = await response.json()
        return rejectWithValue(error.message || 'Login failed')
      }
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('auth-token')
  // Call logout API if needed
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      localStorage.setItem('auth-token', action.payload)
    },
    
    clearError: (state) => {
      state.error = null
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { setUser, setToken, clearError } = authSlice.actions
export default authSlice.reducer`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_stores/authSlice.ts',
    authSlice,
    'feat: add Redux authentication slice',
    token
  );

  // Generate Redux store configuration
  const storeConfig = `import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_stores/store.ts',
    storeConfig,
    'feat: add Redux store configuration',
    token
  );

  // Generate API client for Redux
  const apiClient = `import type { RootState } from '../_stores/store'

export const createApiClient = (getState: () => RootState) => ({
  get: async (url: string) => {
    const token = getState().auth.token
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
  
  post: async (url: string, data: any) => {
    const token = getState().auth.token
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  put: async (url: string, data: any) => {
    const token = getState().auth.token
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  delete: async (url: string) => {
    const token = getState().auth.token
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
})`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_api/client.ts',
    apiClient,
    'feat: add API client with Redux authentication',
    token
  );
}

async function generateBasicAuthLogic(owner: string, repo: string, config: ProjectConfig, token: string) {
  // Generate types file first (if not already created)
  const authTypes = `export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User) => void
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_types/auth.ts',
    authTypes,
    'feat: add authentication types',
    token
  );

  const authContext = `'use client'
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthContextType } from '../_types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    // Load saved auth state from localStorage
    const savedToken = localStorage.getItem('auth-token')
    const savedUser = localStorage.getItem('auth-user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Replace this with your actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        setUser(data.user)
        setToken(data.token)
        
        // Save to localStorage
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('auth-user', JSON.stringify(data.user))
        
        setIsLoading(false)
        return true
      } else {
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    
    // Clear localStorage
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_providers/auth-context.tsx',
    authContext,
    'feat: add React Context authentication',
    token
  );

  // Generate API client for Context-based auth
  const apiClient = `export const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('auth-token')
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
  
  post: async (url: string, data: any) => {
    const token = localStorage.getItem('auth-token')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  put: async (url: string, data: any) => {
    const token = localStorage.getItem('auth-token')
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
  
  delete: async (url: string) => {
    const token = localStorage.getItem('auth-token')
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? \`Bearer \${token}\` : '',
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
}`;

  await createOrUpdateFile(
    owner,
    repo,
    'app/_api/client.ts',
    apiClient,
    'feat: add API client with Context authentication',
    token
  );
}

async function generateLoginComponent(owner: string, repo: string, config: ProjectConfig, token: string) {
  const isTypeScript = config.language === 'typescript';
  const fileExtension = isTypeScript ? 'tsx' : 'jsx';
  
  let loginComponent = '';
  
  if (config.stateManagement === 'zustand') {
    loginComponent = `'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '${isTypeScript ? '@/app/_stores/auth-store' : '../_stores/auth-store'}'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e${isTypeScript ? ': React.FormEvent' : ''}) => {
    e.preventDefault()
    setError('')
    
    const success = await login(email, password)
    
    if (success) {
      router.push('/dashboard') // Redirect to your app's main page
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}`;
  } else if (config.stateManagement === 'redux') {
    loginComponent = `'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { loginAsync, clearError } from '${isTypeScript ? '@/app/_stores/authSlice' : '../_stores/authSlice'}'
${isTypeScript ? 'import type { RootState, AppDispatch } from \'@/app/_stores/store\'' : ''}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const dispatch = useDispatch()${isTypeScript ? ' as AppDispatch' : ''}
  const { isLoading, error } = useSelector((state${isTypeScript ? ': RootState' : ''}) => state.auth)
  const router = useRouter()

  const handleSubmit = async (e${isTypeScript ? ': React.FormEvent' : ''}) => {
    e.preventDefault()
    dispatch(clearError())
    
    const result = await dispatch(loginAsync({ email, password }))
    
    if (loginAsync.fulfilled.match(result)) {
      router.push('/dashboard') // Redirect to your app's main page
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}`;
  } else {
    // Basic auth with Context
    loginComponent = `'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '${isTypeScript ? '@/app/_providers/auth-context' : '../_providers/auth-context'}'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e${isTypeScript ? ': React.FormEvent' : ''}) => {
    e.preventDefault()
    setError('')
    
    const success = await login(email, password)
    
    if (success) {
      router.push('/dashboard') // Redirect to your app's main page
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}`;
  }

  await createOrUpdateFile(
    owner,
    repo,
    `app/_components/LoginPage.${fileExtension}`,
    loginComponent,
    'feat: add login page component',
    token
  );

  // Create the actual page that uses the component
  const loginPageWrapper = `import LoginPage from '../../../_components/LoginPage'

export default function Page() {
  return <LoginPage />
}`;

  await createOrUpdateFile(
    owner,
    repo,
    `app/(pages)/auth/login/page.${fileExtension}`,
    loginPageWrapper,
    'feat: add login page route',
    token
  );
  
  // Create a simple dashboard page as an example
  const dashboardComponent = `'use client'
import { useRouter } from 'next/navigation'
${config.stateManagement === 'zustand' ? "import { useAuthStore } from '@/app/_stores/auth-store'" : ''}
${config.stateManagement === 'redux' ? "import { useSelector, useDispatch } from 'react-redux'\nimport { logoutAsync } from '@/app/_stores/authSlice'\nimport type { RootState, AppDispatch } from '@/app/_stores/store'" : ''}
${config.stateManagement === 'none' ? "import { useAuth } from '@/app/_providers/auth-context'" : ''}

export default function DashboardPage() {
${config.stateManagement === 'zustand' ? '  const { user, logout } = useAuthStore()' : ''}
${config.stateManagement === 'redux' ? '  const { user } = useSelector((state: RootState) => state.auth)\n  const dispatch = useDispatch() as AppDispatch' : ''}
${config.stateManagement === 'none' ? '  const { user, logout } = useAuth()' : ''}
  const router = useRouter()

  const handleLogout = () => {
${config.stateManagement === 'zustand' ? '    logout()' : ''}
${config.stateManagement === 'redux' ? '    dispatch(logoutAsync())' : ''}
${config.stateManagement === 'none' ? '    logout()' : ''}
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name || user?.email || 'User'}!
              </h1>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900">Getting Started</h3>
                <p className="text-blue-700 mt-2">
                  This is your dashboard. Start building your app from here!
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-900">Authentication</h3>
                <p className="text-green-700 mt-2">
                  Your login system is ready with ${config.stateManagement !== 'none' ? config.stateManagement : 'React Context'} state management.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-purple-900">Next Steps</h3>
                <p className="text-purple-700 mt-2">
                  Add your business logic, connect to a database, and build amazing features!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`;

  await createOrUpdateFile(
    owner,
    repo,
    `app/_components/DashboardPage.${fileExtension}`,
    dashboardComponent,
    'feat: add dashboard page component',
    token
  );

  // Create the actual page that uses the component
  const dashboardPageWrapper = `import DashboardPage from '../../_components/DashboardPage'

export default function Page() {
  return <DashboardPage />
}`;

  await createOrUpdateFile(
    owner,
    repo,
    `app/(pages)/dashboard/page.${fileExtension}`,
    dashboardPageWrapper,
    'feat: add dashboard page route',
    token
  );
}

export async function GET() {
  return NextResponse.json({ message: 'API is alive 🚀' });
}

export async function POST(req: NextRequest) {
  try {
    const {
      provider,
      projectName,
      visibility,
      namespace,
      config,
      ghTemplateOwner,
      ghTemplateRepo,
      glTemplatesGroupId,
      glTemplateProjectId,
    } = await req.json();

    if (!provider || !projectName || !namespace) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // ---------- GitHub ----------
    if (provider === 'github') {
      const token = process.env.GITHUB_TOKEN!;
      const templateOwner = ghTemplateOwner || process.env.GH_TEMPLATE_OWNER!;
      const templateRepo = ghTemplateRepo || process.env.GH_TEMPLATE_REPO!;
      const privateFlag = visibility !== 'public';

      const ghRes = await fetch(
        `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: namespace, // destination org/user
            name: projectName,
            private: privateFlag,
            include_all_branches: false,
          }),
        }
      );

      const ghData = await ghRes.json();
      if (!ghRes.ok) {
        return NextResponse.json({ message: ghData?.message || 'GitHub error', details: ghData }, { status: ghRes.status });
      }

      // Customize the repository based on configuration
      if (config) {
        console.log('🔧 Customizing repository with config:', JSON.stringify(config, null, 2));
        try {
          // Wait a bit for the repository to be fully created
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await customizeRepository(namespace, projectName, config, token);
          console.log('✅ Repository customization completed successfully');
        } catch (customizeError) {
          console.error('❌ Error customizing repository:', customizeError);
          // Return the error so we can see what's wrong
          return NextResponse.json({ 
            message: 'Repository created but customization failed', 
            webUrl: ghData.html_url,
            error: customizeError instanceof Error ? customizeError.message : 'Unknown error'
          }, { status: 201 });
        }
      } else {
        console.log('⚠️ No config provided, skipping customization');
      }

      return NextResponse.json({ webUrl: ghData.html_url }, { status: 201 });
    }

    // ---------- GitLab ----------
    if (provider === 'gitlab') {
      const token = process.env.GITLAB_TOKEN!;
      const base = process.env.GITLAB_BASE_URL || 'https://gitlab.com';

      const body: Record<string, string | number | boolean> = {
        name: projectName,
        namespace_id: Number(namespace),
        visibility: visibility || 'private',
        use_custom_template: true,
      };

      if (glTemplatesGroupId) body.group_with_project_templates_id = Number(glTemplatesGroupId);
      if (glTemplateProjectId) body.template_project_id = Number(glTemplateProjectId);

      const glRes = await fetch(`${base}/api/v4/projects`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const glData = await glRes.json();
      if (!glRes.ok) {
        return NextResponse.json({ message: glData?.message || 'GitLab error', details: glData }, { status: glRes.status });
      }

      return NextResponse.json({ webUrl: glData.web_url }, { status: 201 });
    }

    return NextResponse.json({ message: 'Unknown provider' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
