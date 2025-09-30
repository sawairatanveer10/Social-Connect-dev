import React from "react";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import { home, addCircle, person } from "ionicons/icons";

import Home from "./Home";
import CreatePost from "./CreatePost";
import Profile from "./Profile";

const Navigation: React.FC = () => {
  return (
    <IonTabs>
      {/* Router Outlet */}
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/create-post" component={CreatePost} />
        {/* Profile route: own or other user */}
        <Route exact path="/profile" component={Profile} />
        <Route exact path="/profile/:userId" component={Profile} />
        {/* Default redirect */}
        <Redirect exact from="/" to="/home" />
      </IonRouterOutlet>

      {/* Bottom Tab Bar */}
      <IonTabBar slot="bottom" className="custom-tabbar">
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        <IonTabButton tab="create-post" href="/create-post">
          <IonIcon icon={addCircle} />
          <IonLabel>Create</IonLabel>
        </IonTabButton>

        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={person} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>

      {/* Styling */}
      <style>
        {`
          .custom-tabbar {
            --background: #000;
            border-top: 1px solid #111;
            height: 60px;
          }

          .custom-tabbar ion-icon {
            font-size: 24px;
          }

          .custom-tabbar ion-label {
            font-size: 12px;
            color: #fff;
          }
        `}
      </style>
    </IonTabs>
  );
};

export default Navigation;
