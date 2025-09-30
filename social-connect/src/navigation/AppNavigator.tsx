import React, { useEffect, useState } from "react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Switch, Redirect } from "react-router-dom";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import Navigation from "../pages/Navigation";
import { auth } from "../lib/firebase";

const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        if (isMounted) setIsLoggedIn(!!user);
      },
      (error) => {
        console.error("Auth error:", error);
        if (isMounted) setIsLoggedIn(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Loading screen
  if (isLoggedIn === null) {
    return (
      <IonReactRouter>
        <div
          style={{
            padding: 50,
            textAlign: "center",
            fontSize: 18,
            color: "#666",
          }}
        >
          🔄 Checking authentication...
        </div>
      </IonReactRouter>
    );
  }

  return (
    <IonReactRouter>
      <Switch>
        {!isLoggedIn && (
          <>
            <Route exact path="/signin" component={SignIn} />
            <Route exact path="/signup" component={SignUp} />
            <Route exact path="/forgot" component={ForgotPassword} />
            <Route exact path="/">
              <Redirect to="/signin" />
            </Route>
          </>
        )}

        {isLoggedIn && <Route path="/" component={Navigation} />}
      </Switch>
    </IonReactRouter>
  );
};

export default AppNavigator;
