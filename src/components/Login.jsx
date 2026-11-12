import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../components/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/css/style.css';
import './Login.css';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { apiService } from '../services/api';
import { AUTH_MODE, USES_GATEWAY } from '../services/http/apiClient';
import { canOpenPage, fetchSession } from '../services/auth/myAccess';
import sessionManager from '../utils/SessionManager';
import useSessionStore from '../store/useSessionStore';

// Cognito sign-in replaces the GetPassword check when the app goes through etms-api.
const USE_COGNITO = USES_GATEWAY && AUTH_MODE === 'cognito';
const cognito = () => import('../services/auth/cognitoAuth');

const Login = () => {
  const navigate = useNavigate();
  // Split selectors to avoid infinite re-renders due to new object references
  const login = useSessionStore((state) => state.login);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const allowedPaths = useSessionStore((state) => state.allowedPaths);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Cognito only: credentials | newPassword | totp | forgotRequest | forgotConfirm
  const [step, setStep] = useState('credentials');
  const [challenge, setChallenge] = useState({ newPassword: '', confirmPassword: '', code: '' });
  const [info, setInfo] = useState('');
  const [passwordRules, setPasswordRules] = useState('');

  useEffect(() => {
    if (USE_COGNITO) cognito().then((m) => setPasswordRules(m.PASSWORD_RULES));
  }, []);

  const goToStep = (next, message = '') => {
    setStep(next);
    setInfo(message);
    setSubmitError('');
    setChallenge({ newPassword: '', confirmPassword: '', code: '' });
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (allowedPaths.includes("MySchedule")) {
        navigate("/MySchedule", { replace: true });
      } else if (allowedPaths.length > 0) {
        navigate(`/${allowedPaths[0]}`, { replace: true });
      }
    }
  }, [isAuthenticated, allowedPaths, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'User Name is required';
    }
    // else if (!/\S+@\S+\.\S+/.test(formData.username)) {
    //   newErrors.username = 'Email is invalid';
    // }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    //else if (formData.password.length < 6) {
    //   newErrors.password = 'Password must be at least 6 characters';
    // }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // After the password check: load the user's details and menus, then open their first page.
  // With Cognito, one call to etms-api (/api/v1/me) returns the details, access and
  // menu. Otherwise the legacy calls run (dev auth needs the details first: its
  // identity header comes from the stored session).
  const completeLogin = async () => {
    let userdetails = null;
    if (!USE_COGNITO) {
      userdetails = await apiService.Spr_GetuserId(formData);
      if (USES_GATEWAY && userdetails?.[0]) sessionManager.setUserSession(userdetails);
    }
    const session = USES_GATEWAY ? await fetchSession() : null;
    if (session?.user) userdetails = [session.user];
    if (!userdetails?.[0]) {
      setSubmitError('Your account could not be loaded. Please contact your administrator.');
      return;
    }
    // console.log('User Details:', userdetails[0]);

    //localStorage.setItem('userdetails', JSON.stringify(userdetails[0]));
    if (userdetails[0].empCode !== null) {
      sessionManager.setUserSession(userdetails);
      //sessionStorage.setItem('FacilityID', userdetails[0].FacilityID);
      //sessionStorage.setItem('FacilityName', userdetails[0].FacilityName);
      //sessionStorage.setItem('FirstTimeLogin', userdetails[0].FirstTimeLogin);
      //sessionStorage.setItem('UserID', userdetails[0].ID);
      //sessionStorage.setItem('ISadmin', userdetails[0].ISadmin);
      //sessionStorage.setItem('IsBackupManager', userdetails[0].IsBackupManager);
      //sessionStorage.setItem('IsNormalUser', userdetails[0].IsNormalUser);
      //sessionStorage.setItem('LocationName', userdetails[0].LocationName);
      //sessionStorage.setItem('ManagerId', userdetails[0].ManagerId);
      //sessionStorage.setItem('empCode', userdetails[0].empCode);
      //sessionStorage.setItem('empName', userdetails[0].empName);
      //sessionStorage.setItem('isSpoc', userdetails[0].isSpoc);
      //sessionStorage.setItem('locationId', userdetails[0].locationId);
      //sessionStorage.setItem('ManagerId', userdetails[0].ManagerId);
      //sessionStorage.setItem('userName', userdetails[0].userName);
      // Navigate to dashboard
      
      // 👇 Menus for the user. Through etms-api they came with /api/v1/me, built from
      // the same rights as page access (which already includes RouteMap and
      // ReplicateSchedule).
      const menus = session
        ? session.menuItems
        : await apiService.Spr_GetMenuItem_V2({ userID: userdetails[0].ID });
      const access = session?.access ?? null;

      if (!USES_GATEWAY) {
        // ✅ Manually push RouteMap if not already included
        if (!menus.some(menu => menu.MenuURL === "RouteMap")) {
          menus.push({ MenuURL: "RouteMap" });
        }
        // Manually add 'ReplicateSchedule' if not already included
        if (!menus.some(menu => menu.MenuURL === "ReplicateSchedule")) {
          menus.push({ MenuURL: "ReplicateSchedule" });
        }
      }

      // Update store with full menus (including ReplicateSchedule for authorization)
      login(userdetails[0], menus, access);

      // Calculate allowed paths for navigation
      const allowedPaths = menus
        .filter(item => item.MenuURL)
        .map(item => item.MenuURL.replace(/^\/+/, "")) // Clean leading slash if any
        .filter(path => !access || canOpenPage(access, path));

      sessionStorage.setItem("ID", userdetails[0].ID);

      // 👇 Navigate only if MySchedule is one of the allowed paths
      if (allowedPaths.includes("MySchedule")) {
        navigate("/MySchedule");
      } else if (allowedPaths.length > 0) {
        navigate(`/${allowedPaths[0]}`); // navigate to first allowed page
      } else {
        setSubmitError('User Not found!!');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (USE_COGNITO && step !== 'credentials') {
      await handleCognitoStep();
      return;
    }
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (USE_COGNITO) {
        const auth = await cognito();
        const next = await auth.startSignIn(formData.username.trim(), formData.password);
        if (next === 'done') await completeLogin();
        else showChallenge(next);
      } else {
        const response = await apiService.login(formData);
        if (response[0] === '1') await completeLogin();
        else setSubmitError(response.Message || 'Invalid credentials!!');
      }
    } catch (error) {
      console.error('Login error:', error);
      setSubmitError(
        USE_COGNITO && error?.name
          ? (await cognito()).authErrorMessage(error)
          : 'Failed to connect to the server. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cognito: what to ask for after the user name and password.
  const showChallenge = (next) => {
    if (next === 'newPassword') goToStep('newPassword', 'Welcome! Choose your own password to finish signing in.');
    else if (next === 'totp') goToStep('totp', 'Enter the 6-digit code from your authenticator app.');
    else goToStep('forgotRequest', 'Your password needs to be reset. We will email you a code.');
  };

  const handleCognitoStep = async () => {
    const { newPassword, confirmPassword, code } = challenge;
    if ((step === 'newPassword' || step === 'forgotConfirm') && newPassword !== confirmPassword) {
      setSubmitError('The two passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const auth = await cognito();
      if (step === 'newPassword' || step === 'totp') {
        const next = await auth.answerSignInChallenge(step === 'totp' ? code.trim() : newPassword);
        if (next === 'done') await completeLogin();
        else showChallenge(next);
      } else if (step === 'forgotRequest') {
        if (!formData.username.trim()) {
          setSubmitError('Enter your user name.');
          return;
        }
        const destination = await auth.requestPasswordReset(formData.username.trim());
        goToStep('forgotConfirm', `We emailed a code to ${destination}. Enter it with your new password.`);
      } else if (step === 'forgotConfirm') {
        await auth.completePasswordReset(formData.username.trim(), code.trim(), newPassword);
        setFormData((prev) => ({ ...prev, password: '' }));
        goToStep('credentials', 'Password changed. Sign in with your new password.');
      }
    } catch (error) {
      console.error('Sign-in step error:', error);
      setSubmitError((await cognito()).authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeChange = (e) => {
    const { name, value } = e.target;
    setChallenge((prev) => ({ ...prev, [name]: value }));
  };

  // Prevent flash of login screen if authenticated
  if (isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container-fluid login-page" id="loginBg">
      <div className="container">
        <div className="row menu_mb">
          <div className="col-lg-12">
            <nav id="menu" className="d-flex justify-content-between">
              <a href="/"><img src="/images/logo.svg" alt="ETMS Logo" /></a>

              <div className="d-flex justify-content-between align-items-center">
                {/* <ul className="d-flex">
                  <a href="#!">FAQ'S</a>
                  <a href="#!">Contact Us</a>
                  <a href="#!">Transport Policy</a>
                </ul> */}
                <button className="btn btn-primary btn-sm">Need Help?</button>
              </div>
            </nav>
          </div>
        </div>

        <div className="loginMiddle">
          <div className="row">
            <div className="col-12 col-lg-6">
              <div className="loginBx">
                <h3>Login</h3>
                <p className="overline_text">Enter your user name and password to sign in</p>
                <div className="loginLeft">
                  <Form onSubmit={handleSubmit}>
                    {submitError && <Alert variant="danger">{submitError}</Alert>}
                    {info && <Alert variant="info">{info}</Alert>}

                    {(step === 'credentials' || step === 'forgotRequest') && (
                      <Form.Group className="mb-3">
                        <Form.Label>User Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder='Enter your user name'
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                          isInvalid={!!errors.username}
                          disabled={isLoading}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.username}
                        </Form.Control.Feedback>
                      </Form.Group>
                    )}

                    {step === 'credentials' && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder='Enter your password'
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!errors.password}
                            disabled={isLoading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="RememberMe"
                              defaultChecked
                            />
                            <label className="form-check-label text1-body" htmlFor="RememberMe">
                              Remember me
                            </label>
                          </div>
                          {USE_COGNITO && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0"
                              onClick={() => goToStep('forgotRequest', 'Enter your user name and we will email you a code.')}
                              disabled={isLoading}
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {(step === 'totp' || step === 'forgotConfirm') && (
                      <Form.Group className="mb-3">
                        <Form.Label>{step === 'totp' ? 'Authenticator code' : 'Code from the email'}</Form.Label>
                        <Form.Control
                          type="text"
                          name="code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="6-digit code"
                          value={challenge.code}
                          onChange={handleChallengeChange}
                          disabled={isLoading}
                          required
                        />
                      </Form.Group>
                    )}

                    {(step === 'newPassword' || step === 'forgotConfirm') && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>New password</Form.Label>
                          <Form.Control
                            type="password"
                            name="newPassword"
                            autoComplete="new-password"
                            value={challenge.newPassword}
                            onChange={handleChallengeChange}
                            disabled={isLoading}
                            required
                          />
                          <Form.Text muted>{passwordRules}</Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm new password</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            autoComplete="new-password"
                            value={challenge.confirmPassword}
                            onChange={handleChallengeChange}
                            disabled={isLoading}
                            required
                          />
                        </Form.Group>
                      </>
                    )}

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-nor"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? 'Please wait...'
                          : {
                              credentials: 'Login',
                              newPassword: 'Set password and sign in',
                              totp: 'Verify',
                              forgotRequest: 'Email me a code',
                              forgotConfirm: 'Change password',
                            }[step]}
                      </button>
                    </div>

                    {step !== 'credentials' && (
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          className="btn btn-link btn-sm"
                          onClick={() => goToStep('credentials')}
                          disabled={isLoading}
                        >
                          Back to sign in
                        </button>
                      </div>
                    )}
                  </Form>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="loginRight">
                <img src="/images/icon.svg" alt="ETMS Icon" />
                <h2 className="text-white">e-Transport Management System</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <p className="text1-body">Copyright © {new Date().getFullYear()}, etms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;