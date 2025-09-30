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
  useIonRouter,
} from "@ionic/react";
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";

interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
}

const SignUpSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
});

const SignUp: React.FC = () => {
  const router = useIonRouter();

  const handleSignup = async (values: SignUpFormValues, helpers: FormikHelpers<SignUpFormValues>) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, values.email, values.password);

      // Default profile picture
      const defaultProfileUrl = "https://ionicframework.com/docs/img/demos/avatar.svg";
      const response = await fetch(defaultProfileUrl);
      const blob = await response.blob();
      const storageRef = ref(storage, `profiles/${userCred.user.uid}`);
      await uploadBytes(storageRef, blob);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(userCred.user, { displayName: values.name, photoURL });

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: values.name,
        email: values.email,
        photoURL,
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("user", userCred.user.uid);
      router.push("/", "forward", "replace");
    } catch (error: any) {
      alert(error.message);
      console.error("SignUp error:", error.message);
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
                  Create Account
                </h2>

                <Formik<SignUpFormValues>
                  initialValues={{ name: "", email: "", password: "" }}
                  validationSchema={SignUpSchema}
                  onSubmit={handleSignup}
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
                        <IonLabel position="stacked">Name</IonLabel>
                        <IonInput
                          placeholder="Enter your name"
                          type="text"
                          value={values.name}
                          onIonInput={(e) => setFieldValue("name", e.detail.value ?? "")}
                          onIonBlur={() => handleBlur("name")}
                        />
                      </IonItem>
                      {touched.name && errors.name && (
                        <IonText color="danger" style={{ fontSize: 12, marginBottom: 12, display: "block" }}>
                          {errors.name}
                        </IonText>
                      )}

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
                          backgroundColor: "#3B3B3B", // Dark gray button
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          padding: "12px 0",
                        }}
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                      >
                        Sign Up
                      </IonButton>

                      <div style={{ marginTop: 16, textAlign: "center" }}>
                        <IonText
                          style={{ fontSize: 14, color: "#555", cursor: "pointer" }}
                          onClick={() => router.push("/signin", "back")}
                        >
                          Already have an account? Sign In
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

export default SignUp;

