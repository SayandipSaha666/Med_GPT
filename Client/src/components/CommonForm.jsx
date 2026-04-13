import React from 'react'
import CommonInput from './CommonInput'

const formTypes = {
    INPUT: "input",
    SELECT: "select",
    TEXTAREA: "textarea",
};

function CommonForm({ handleSubmit, buttonText, formControls = [], formData, onChange }) {
    const renderFormItem = (formInput) => {
        let content = null;
        switch (formInput?.component_type) {
            case formTypes.INPUT:
                content = (
                    <CommonInput
                        name={formInput.name}
                        id={formInput.id}
                        label={formInput.label}
                        placeholder={formInput.placeholder}
                        type={formInput.type}
                        value={formData[formInput.name]}
                        onChange={onChange}
                        key={formInput.id}
                    />
                );
                break;
            case formTypes.SELECT:
                content = (
                    <Select
                        name={formInput.name}
                        id={formInput.id}
                        value={formData[formInput.name]}
                        onChange={onChange}
                    >
                        {formInput?.options?.map((option)=>{
                            return (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            )
                        })}
                    </Select>
                );
                break;
            case formTypes.TEXTAREA:
                content = (
                    <textarea
                        name={formInput.name}
                        id={formInput.id}
                        value={formData[formInput.name]}
                        onChange={onChange}
                        placeholder={formInput.placeholder}
                        rows={formInput.rows || 3}
                    />
                )
                break;
            default:
                content = (
                    <CommonInput
                        name={formInput.name}
                        id={formInput.id}
                        label={formInput.label}
                        placeholder={formInput.placeholder}
                        type={formInput.type}
                        value={formData[formInput.name]}
                        onChange={onChange}
                        key={formInput.id}
                    />
                );
            break;
        }
        return content;
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {
                Array.isArray(formControls) && formControls?.length > 0 && formControls.map((formInput) => {
                    return renderFormItem(formInput)
                })
            }
            <button type='submit' className="w-full py-2.5 rounded-md bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white font-medium text-sm hover:opacity-90 transition-opacity">{buttonText}</button>
        </form>
    )
}

export default CommonForm