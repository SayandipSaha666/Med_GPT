import React from 'react'
import CommonForm from '../CommonForm'
import {useState,useContext} from 'react';
import { LoginControls } from './config';
import { callLoginUserApi } from '../../services/api_services';
import { GlobalContext } from '../../context/context';
import {useNavigate} from 'react-router-dom'

function SignIn() {
  const initialState = {
    email: "",
    password: ""
  }
  const [formData,setFormData] = useState(initialState)
  const {setUser} = useContext(GlobalContext)
  const navigate = useNavigate()
  const onChange = (e) => {
    const {name, value} = e.target
    setFormData({
      ...formData,
      [name] : value
    })
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    // DB Calls
    console.log("Data:", formData)
    const response = await callLoginUserApi(formData)
    if(response.success){
      setUser(response.data)
      navigate("/main")
    }
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