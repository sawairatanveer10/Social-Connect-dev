// src/pages/SearchScreen.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonImg,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { searchUsersOrPosts } from "../firebase/searchFunctions";

const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ users: any[] }>({ users: [] });
  const history = useHistory();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim() === "") {
      setResults({ users: [] });
      return;
    }

    try {
      const data = await searchUsersOrPosts(text);
      setResults({ users: data.users });
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  const goToUserProfile = (userId: string) => {
    history.push(`/profile/${userId}`);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="light">
          <IonTitle
            style={{
              fontWeight: 700,
              fontSize: 22,
              textAlign: "center",
              letterSpacing: "0.3px",
            }}
          >
            Search
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ backgroundColor: "#f8f8f8" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            minHeight: "100vh",
            paddingTop: "20px",
          }}
        >
          {/* Elegant Search Bar */}
          <IonSearchbar
            value={query}
            onIonInput={(e) => handleSearch(e.detail.value!)}
            placeholder="Search users"
            debounce={300}
            showClearButton="focus"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 30,
              height: 50,
              width: "92%",
              maxWidth: 600,
              fontSize: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              marginTop: results.users.length === 0 ? "20vh" : "15px",
              paddingInline: "10px",
              transition: "all 0.25s ease",
            }}
          />

          {/* Search Results */}
          {results.users.length > 0 && (
            <IonList
              style={{
                marginTop: 15,
                width: "92%",
                maxWidth: 600,
                background: "transparent",
                borderRadius: 10,
              }}
            >
              {results.users.map((user) => (
                <IonItem
                  key={user.id}
                  button
                  onClick={() => goToUserProfile(user.id)}
                  lines="none"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    marginBottom: 8,
                    padding: "10px 14px",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#f4f4f4";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <IonAvatar
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1px solid #ddd",
                      }}
                    >
                      <IonImg src={user.photoURL || "/default-avatar.png"} />
                    </IonAvatar>

                    <div style={{ marginLeft: 14, display: "flex", flexDirection: "column" }}>
                      <IonLabel
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: "#222",
                        }}
                      >
                        {user.name}
                      </IonLabel>
                      {user.username && (
                        <IonLabel
                          style={{
                            fontSize: 13,
                            color: "#777",
                            marginTop: 2,
                          }}
                        >
                          @{user.username}
                        </IonLabel>
                      )}
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}

          {/* No Results Message */}
          {results.users.length === 0 && query.trim() !== "" && (
            <IonLabel
              style={{
                marginTop: 50,
                textAlign: "center",
                color: "#999",
                fontSize: 15,
              }}
            >
              No users found
            </IonLabel>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SearchScreen;
