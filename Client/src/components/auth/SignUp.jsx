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
  const [signupData, setSignupData] = useState(null)
  const [formData,setFormData] = useState(initialState)

  const onChange = (e) => {
    const {name,value} = e.target
    setFormData({...formData,
      [name]: value
    })
  }

  async function handleSubmit(e){
    e.preventDefault();
    try {
      // DB calls
      console.log("Data:", formData);
      setSignupData(formData)
    } catch (error) {
      console.log(error?.message || error?.details[0]?.message)
    }
    setFormData(initialState)
  }

  return (
    <div>
      <CommonForm
        handleSubmit = {handleSubmit}
        buttonText="Sign Up"
        formControls={SignupControls}
        formData={formData}
        onChange={onChange}
      />
    </div>
  )
}

export default SignUp