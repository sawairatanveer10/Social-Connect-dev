import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useHistory } from "react-router-dom";

interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async (
    values: ForgotPasswordFormValues,
    helpers: FormikHelpers<ForgotPasswordFormValues>
  ) => {
    try {
      await sendPasswordResetEmail(auth, values.email);
      setMessage(`✅ Reset link sent to ${values.email}`);
    } catch (error: any) {
      console.error("❌ Reset failed:", error.message);
      setMessage(error.message);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <Formik<ForgotPasswordFormValues>
          initialValues={{ email: "" }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleReset}
        >
          {({ values, errors, touched, setFieldValue, handleBlur, handleSubmit }) => (
            <>
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  type="email"
                  value={values.email}
                  onIonInput={(e) => setFieldValue("email", (e.detail.value ?? ""))}
                  onIonBlur={() => handleBlur("email")}
                />
              </IonItem>
              {touched.email && errors.email && (
                <IonText color="danger">{errors.email}</IonText>
              )}

              {message && (
                <IonText color={message.startsWith("✅") ? "success" : "danger"}>
                  <p style={{ margin: 6 }}>{message}</p>
                </IonText>
              )}

              <IonButton expand="block" style={{ marginTop: 20 }} onClick={() => handleSubmit()}>
                Send Reset Link
              </IonButton>

              <IonButton
                fill="clear"
                expand="block"
                style={{ marginTop: 8 }}
                onClick={() => history.push("/signin")}
              >
                Back to Sign In
              </IonButton>
            </>
          )}
        </Formik>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
