import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import AuthRoute from './components/auth/AuthRoute'

const AppRoutes = () => {
    return (

        <BrowserRouter>
            <Routes>
                <Route path='/' element={<AuthRoute mode="protected"><Home /></AuthRoute>} />
                <Route path='/register' element={<AuthRoute mode="guest"><Register /></AuthRoute>} />
                <Route path='/login' element={<AuthRoute mode="guest"><Login /></AuthRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes
