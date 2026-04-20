import React from 'react';
import Datepicker from "react-tailwindcss-datepicker";

export default function FinDatePicker({ value, onChange, placeholder = "Seleccione una fecha...", maxDate, minDate }) {
    const defaultDate = value ? { startDate: value, endDate: value } : { startDate: null, endDate: null };

    const handleValueChange = (newValue) => {
        if (onChange) {
            onChange(newValue ? newValue.startDate : '');
        }
    };

    return (
        <div className="relative mt-1">
            <Datepicker
                primaryColor={"blue"}
                useRange={false}
                asSingle={true}
                value={defaultDate}
                onChange={handleValueChange}
                displayFormat={"DD/MM/YYYY"}
                placeholder={placeholder}
                inputClassName="w-full fin-input bg-white shadow-sm pr-12 focus:ring-blue-500 focus:border-blue-500"
                toggleClassName="absolute top-0 right-0 h-full px-3 text-gray-400 focus:outline-none hover:text-blue-600 transition"
                maxDate={maxDate}
                minDate={minDate}
                i18n={"es"}
            />
        </div>
    );
}
