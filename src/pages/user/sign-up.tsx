import CTextField from "~/mui-c/TextField";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Layout from "~/components/Layout";
import { CButton } from "~/mui-c/Button";
import { getValidation } from "~/utils/client/form-validation";
import cfetch from "~/lib/cfetch";
import { useStore } from "~/zustand";
import { setJwtToken, setRefreshToken } from "~/utils/client/auth";
import { useRouter } from "next/router";
import Link from "next/link";

interface SignUpProps {}

const SignUp: React.FC<SignUpProps> = ({}) => {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const result = await cfetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      if (result.data) {
        setJwtToken(result.data.jwt);
        setRefreshToken(result.data.refreshToken);

        // fetch user data
        const userResult = await cfetch("/api/users/me", {
          method: "GET",
        });

        setUser(userResult.data);

        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setFormError("something went wrong!");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <div className="wrapper">
        <main>
          <h1>Sign Up</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form__fields">
              <div className="row">
                <label htmlFor="name">Name</label>
                <Controller
                  name="name"
                  control={control}
                  rules={getValidation({ name: "name" })}
                  render={({ field }) => (
                    <CTextField
                      id="name"
                      placeholder="Enter a name"
                      fullWidth
                      required
                      error={"name" in errors}
                      autoComplete="name"
                      helperText={errors.name ? errors["name"].message : ""}
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="row">
                <label htmlFor="email">Email</label>
                <Controller
                  name="email"
                  control={control}
                  rules={getValidation({ name: "email" })}
                  render={({ field }) => (
                    <CTextField
                      type="email"
                      placeholder="Enter a email"
                      fullWidth
                      {...field}
                      autoComplete="email"
                      error={"email" in errors}
                      helperText={errors.email ? errors["email"].message : ""}
                    />
                  )}
                />
              </div>

              <div className="row">
                <label htmlFor="password">Password</label>
                <Controller
                  name="password"
                  control={control}
                  rules={getValidation({ name: "password", min: 6, max: 15 })}
                  render={({ field }) => (
                    <CTextField
                      type="password"
                      required
                      placeholder="Enter a password"
                      fullWidth
                      {...field}
                      error={"password" in errors}
                      helperText={
                        errors.password ? errors["password"].message : ""
                      }
                    />
                  )}
                />
              </div>
            </div>
            <div className="form__footer">
              {formError && <p className="error">{formError}</p>}
              <div className="form__cta">
                <CButton
                  data-cy="submit"
                  type="submit"
                  variant="contained"
                  sx={{
                    background: "var(--clr-amber10)",
                    padding: "1rem 1.5rem",
                    fontSize: "1.5rem",
                  }}
                  disabled={loading}
                >
                  {loading ? "loading..." : "Submit"}
                </CButton>
              </div>
              <p>
                Already have an account, sign in{" "}
                <Link href={"/user/sign-in"} legacyBehavior>
                  here.
                </Link>
              </p>
            </div>
          </form>
        </main>
      </div>
      <style jsx>{`
        .wrapper {
          padding: 4rem;
          font-size: 1.6rem;
        }
        h1 {
          margin: 2rem 0;
        }
        .row + .row {
          margin-top: 2rem;
        }
        .row label {
          display: block;
          font-size: 1.4rem;
          font-weight: 500;
          line-height: 1.7rem;
          margin-bottom: 1rem;
        }
        .form__cta {
          margin: 1rem 0;
        }
        .form__footer {
          margin-top: 2rem;
        }
        form {
          width: 40%;
        }
        main {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @media (max-width: 1024px) {
          form {
            width: 60%;
          }
        }
        @media (max-width: 768px) {
          .wrapper {
            padding: 1.5rem;
          }
          form {
            width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
};

export default SignUp;
