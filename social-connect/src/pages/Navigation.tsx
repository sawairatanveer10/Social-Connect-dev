import React from "react";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonRouterOutlet,
} from "@ionic/react";
import { Route, Redirect } from "react-router-dom";
import { home, addCircle, person, search } from "ionicons/icons";

import Home from "./Home";
import CreatePost from "./CreatePost";
import Profile from "./Profile";
import SearchScreen from "./SearchScreen"; // new search screen

const Navigation: React.FC = () => {
  return (
    <IonTabs>
      {/* Router Outlet */}
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/search" component={SearchScreen} />
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

        <IonTabButton tab="search" href="/search">
          <IonIcon icon={search} />
        </IonTabButton>

        <IonTabButton tab="create-post" href="/create-post">
          <IonIcon icon={addCircle} />
        </IonTabButton>

        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={person} />
        </IonTabButton>
      </IonTabBar>

      {/* Styling for Instagram-like bottom bar */}
      <style>
        {`
          .custom-tabbar {
            --background: #f0f0f0;  /* gray background */
            border-top: 1px solid #e5e5e5;
            height: 60px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 0 10px;
          }

          /* Hide labels (IG style) */
          .custom-tabbar ion-label {
            display: none;
          }

          .custom-tabbar ion-tab-button {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px 0;
          }

          /* Default icon color */
          .custom-tabbar ion-icon {
            font-size: 26px;
            color: #8e8e8e;
          }

          /* Active tab icon color */
          .custom-tabbar .tab-selected ion-icon {
            color: #000;
          }
        `}
      </style>
    </IonTabs>
  );
};

export default Navigation;
