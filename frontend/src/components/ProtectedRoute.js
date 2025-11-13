import React, { Children } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        //If no token,redirect to login page
        return <Navigate to="/login" />;
    }
    //If token exist,render the requested component(children)
    return children;
};

export default ProtectedRoute;