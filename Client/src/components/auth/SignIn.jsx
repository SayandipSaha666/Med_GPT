import React from 'react'
import CommonForm from '../CommonForm'
import {useState} from 'react';
import { LoginControls } from './config';

function SignIn() {
  const initialState = {
    email: "",
    password: ""
  }
  const [loginData, setLoginData] = useState(null)
  const [formData,setFormData] = useState(initialState)
  const onChange = (e) => {
    const {name, value} = e.target
    setFormData({
      ...formData,
      [name] : value
    })
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    // DB Calls
    console.log("Data:", formData)
    setLoginData(formData)
    setFormData(initialState)
  }
  return (
    <div>
      <CommonForm
        handleSubmit={handleSubmit}
        onChange={onChange}
        formControls={LoginControls}
        buttonText="Login"
        formData={formData}
      />
    </div>
  )
}

export default SignIn