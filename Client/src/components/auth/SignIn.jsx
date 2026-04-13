import React from 'react'
import CommonForm from '../CommonForm'
import {useState} from 'react';
import { LoginControls } from './config';

function SignIn() {
  const initialState = {
    email: "",
    password: ""
  }
  const [loginData, setLoginData] = useState(initialState)
  const onChange = (e) => {
    const {name, value} = e.target
    setLoginData({
      ...loginData,
      [name] : value
    })
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(loginData)
    setLoginData(initialState);
  }
  return (
    <div>
      <CommonForm
        onSubmit={handleSubmit}
        onChange={onChange}
        formControls={LoginControls}
        buttonText="Login"
        formData={loginData}
      />
    </div>
  )
}

export default SignIn