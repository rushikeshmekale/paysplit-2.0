import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login    from './pages/Login'
import Register from './pages/Register'
import Home     from './pages/Home'
import Expenses from './pages/Expenses'
import Friends  from './pages/Friends'
import Profile  from './pages/Profile'
import { Toaster } from 'sonner'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/friends"  element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors expand />
    </AuthProvider>
  )
}

export default App
