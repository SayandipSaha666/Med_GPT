import React from 'react'
import {useState,useContext} from 'react';
import { SignupControls } from './config';
import CommonForm from '../CommonForm';
import { callRegisterUserApi } from '../../services/api_services';
import { GlobalContext } from '../../context/context';
import { useNavigate } from 'react-router-dom';

const initialState = {
  name: "",
  email: "",
  password: ""
};

function SignUp() {
  const [signupData, setSignupData] = useState(null)
  const [formData,setFormData] = useState(initialState)
  const {setUser} = useContext(GlobalContext)
  const navigate = useNavigate()

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
      await setSignupData(formData)
      setFormData(initialState)
      const response = await callRegisterUserApi(signupData)
      if(response.success){
        setUser(response.data)
        navigate("/main")
      }
    } catch (error) {
      console.log(error?.message || error?.details[0]?.message)
    }
    // setFormData(initialState)
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