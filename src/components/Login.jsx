import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../components/css/bootstrap.min.css';   
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/css/style.css';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { apiService } from '../services/api';
import sessionManager from '../utils/SessionManager';
import useSessionStore from '../store/useSessionStore';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsLoading(true);

    if (validateForm()) {
      try {
        const response = await apiService.login(formData);
        // console.log('Login response:', response);

        if (response[0] === '1') {
          // Store user data if needed
          const userdetails = await apiService.Spr_GetuserId(formData);
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
            
            // 👇 Fetch allowed menus for the user
            const menus = await apiService.Spr_GetMenuItem_V2({ userID: userdetails[0].ID });
          
            // ✅ Manually push RouteMap if not already included
            if (!menus.some(menu => menu.MenuURL === "RouteMap")) {
              menus.push({ MenuURL: "RouteMap" });
            }
            // Manually add 'ReplicateSchedule' if not already included
            if (!menus.some(menu => menu.MenuURL === "ReplicateSchedule")) {
              menus.push({ MenuURL: "ReplicateSchedule" });
            }

            // Update store with full menus (including ReplicateSchedule for authorization)
            login(userdetails[0], menus);

            // Calculate allowed paths for navigation
            const allowedPaths = menus
              .filter(item => item.MenuURL)
              .map(item => item.MenuURL.replace(/^\/+/, "")); // Clean leading slash if any

            sessionStorage.setItem("ID", userdetails[0].ID);

            // 👇 Navigate only if MySchedule is one of the allowed paths
            if (allowedPaths.includes("MySchedule")) {
              navigate("/MySchedule");
            } else if (allowedPaths.length > 0) {
              navigate(`/${allowedPaths[0]}`); // navigate to first allowed page
            } else {
              setSubmitError(response.Message || 'User Not found!!');
            }
          }
        } else {
          setSubmitError(response.Message || 'Invalid credentials!!');
        }
      } catch (error) {
        console.error('Login error:', error);
        setSubmitError('Failed to connect to the server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  // Prevent flash of login screen if authenticated
  if (isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container-fluid" id="loginBg">
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

                    <Form.Group className="mb-3">
                      <Form.Label>User Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        placeholder='Enter your user name'
                        value={formData.username}
                        onChange={handleChange}
                        isInvalid={!!errors.username}
                        disabled={isLoading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder='Enter your password'
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                        disabled={isLoading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="form-check form-switch mb-3">
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
                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-nor"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Logging in...' : 'Login'}
                      </button>
                    </div>
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