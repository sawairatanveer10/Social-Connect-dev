import React from "react";
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useHistory } from "react-router-dom";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
});

interface SignInProps {
  onLogin?: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onLogin }) => {
  const history = useHistory();

  const handleLogin = async (
    values: SignInFormValues,
    helpers: FormikHelpers<SignInFormValues>
  ) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      localStorage.setItem("user", userCredential.user.uid);
      onLogin && onLogin();
      history.replace("/home");
    } catch (error: any) {
      alert(error.message);
      console.error("SignIn error:", error.message);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(to bottom, #6a11cb, #2575fc)",
        }}
      >
        <IonGrid style={{ maxWidth: 400, width: "100%" }}>
          <IonRow>
            <IonCol>
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: 32,
                  borderRadius: 16,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h2 style={{ textAlign: "center", marginBottom: 24, color: "#333" }}>
                  Welcome Back!
                </h2>

                <Formik<SignInFormValues>
                  initialValues={{ email: "", password: "" }}
                  validationSchema={SignInSchema}
                  onSubmit={handleLogin}
                >
                  {({ values, errors, touched, setFieldValue, handleBlur, handleSubmit, isSubmitting }) => (
                    <>
                      <IonItem
                        style={{
                          borderRadius: 12,
                          marginBottom: 16,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <IonLabel position="stacked">Email</IonLabel>
                        <IonInput
                          placeholder="Enter your email"
                          type="email"
                          value={values.email}
                          onIonInput={(e) => setFieldValue("email", e.detail.value ?? "")}
                          onIonBlur={() => handleBlur("email")}
                        />
                      </IonItem>
                      {touched.email && errors.email && (
                        <IonText color="danger" style={{ fontSize: 12, marginBottom: 12, display: "block" }}>
                          {errors.email}
                        </IonText>
                      )}

                      <IonItem
                        style={{
                          borderRadius: 12,
                          marginBottom: 24,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <IonLabel position="stacked">Password</IonLabel>
                        <IonInput
                          placeholder="Enter your password"
                          type="password"
                          value={values.password}
                          onIonInput={(e) => setFieldValue("password", e.detail.value ?? "")}
                          onIonBlur={() => handleBlur("password")}
                        />
                      </IonItem>
                      {touched.password && errors.password && (
                        <IonText color="danger" style={{ fontSize: 12, marginBottom: 24, display: "block" }}>
                          {errors.password}
                        </IonText>
                      )}

                      <IonButton
                        expand="block"
                        style={{
                          borderRadius: 12,
                          backgroundColor: "#3B3B3B", // Dark gray
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          padding: "12px 0",
                        }}
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                      >
                        Sign In
                      </IonButton>

                      <div style={{ marginTop: 16, textAlign: "center" }}>
                        <IonText
                          style={{ fontSize: 14, color: "#555", cursor: "pointer" }}
                          onClick={() => history.push("/signup")}
                        >
                          Don’t have an account? Sign Up
                        </IonText>
                        <br />
                        <IonText
                          style={{ fontSize: 14, color: "#555", cursor: "pointer" }}
                          onClick={() => history.push("/forgot")}
                        >
                          Forgot Password?
                        </IonText>
                      </div>
                    </>
                  )}
                </Formik>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SignIn;
