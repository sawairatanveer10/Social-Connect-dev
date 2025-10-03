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
  </IonTabButton>

  <IonTabButton tab="create-post" href="/create-post">
    <IonIcon icon={addCircle} />
  </IonTabButton>

  <IonTabButton tab="profile" href="/profile">
    <IonIcon icon={person} />
  </IonTabButton>
</IonTabBar>

<style>
  {`
    .custom-tabbar {
       --background: #f0f0f0;  /* darker gray for contrast */
      border-top: 1px solid #e5e5e5;
      height: 60px;
      display: flex;
      justify-content: space-around; /* even spacing */
      align-items: center;
      padding: 0 10px; /* side padding */
    }

    /* Hide labels (IG style) */
    .custom-tabbar ion-label {
      display: none;
    }

    .custom-tabbar ion-tab-button {
      flex: 1; /* distribute evenly */
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px 0; /* touch-friendly */
    }

    /* Default icons gray */
    .custom-tabbar ion-icon {
      font-size: 26px;
      color: #8e8e8e;
    }

    /* Active tab black */
    .custom-tabbar .tab-selected ion-icon {
      color: #000;
    }
  `}
</style>

    </IonTabs>
  );
};

export default Navigation;
