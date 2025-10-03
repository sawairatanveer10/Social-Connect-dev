import React, { useEffect, useState } from "react";
import { IonReactRouter } from "@ionic/react-router";
import { Switch } from "react-router-dom";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import Navigation from "../pages/Navigation";
import ChatScreen from "../pages/ChatScreen";
import ChatList from "../pages/ChatList";
import { auth } from "../lib/firebase";

import { ProtectedRoute, GuestRoute } from "./AuthRoutes";

const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(
      (user) => setIsLoggedIn(!!user),
      () => setIsLoggedIn(false)
    );
    return () => unsub();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div style={{ padding: 50, textAlign: "center", fontSize: 18, color: "#666" }}>
        🔄 Checking authentication...
      </div>
    );
  }

  return (
    <IonReactRouter>
      <Switch>
        {/* Public routes */}
        <GuestRoute path="/signin" isLoggedIn={isLoggedIn} component={SignIn} exact />
        <GuestRoute path="/signup" isLoggedIn={isLoggedIn} component={SignUp} exact />
        <GuestRoute path="/forgot" isLoggedIn={isLoggedIn} component={ForgotPassword} exact />

        {/* Protected routes */}
        <ProtectedRoute path="/" isLoggedIn={isLoggedIn} component={Navigation} exact />
        <ProtectedRoute path="/chats" isLoggedIn={isLoggedIn} component={ChatList} exact />
        <ProtectedRoute path="/chat/:chatId" isLoggedIn={isLoggedIn} component={ChatScreen} exact />

        {/* fallback */}
        <ProtectedRoute path="*" isLoggedIn={isLoggedIn} component={Navigation} />
      </Switch>
    </IonReactRouter>
  );
};

export default AppNavigator;
