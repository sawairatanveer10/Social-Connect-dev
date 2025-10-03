import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";

interface AuthRouteProps extends RouteProps {
  isLoggedIn: boolean;
  component: React.ComponentType<any>;
}

// Only accessible if logged in
export const ProtectedRoute: React.FC<AuthRouteProps> = ({ component: Component, isLoggedIn, ...rest }) => (
  <Route
    {...rest}
    render={(props) => (isLoggedIn ? <Component {...props} /> : <Redirect to="/signin" />)}
  />
);

// Only accessible if NOT logged in
export const GuestRoute: React.FC<AuthRouteProps> = ({ component: Component, isLoggedIn, ...rest }) => (
  <Route
    {...rest}
    render={(props) => (!isLoggedIn ? <Component {...props} /> : <Redirect to="/" />)}
  />
);
