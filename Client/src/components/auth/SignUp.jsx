import React from 'react'
import {useState} from 'react';
import { SignupControls } from './config';
import CommonForm from '../CommonForm';

const initialState = {
  name: "",
  email: "",
  password: ""
};

function SignUp() {
  const [signupData, setSignupData] = useState(initialState)

  const onChange = (e) => {
    const {name,value} = e.target
    setSignupData({...signupData,
      [name] : value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(signupData);
    setSignupData(signupData);
  }

  return (
    <div>
      <CommonForm
        onSubmit = {handleSubmit}
        buttonText="Sign Up"
        formControls={SignupControls}
        formData={signupData}
        onChange={onChange}
      />
    </div>
  )
}

export default SignUp