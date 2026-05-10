"use client";
import React, { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Select from "../Select";
import MultiSelect from "../MultiSelect";
import { ChevronDownIcon } from "@/icons";

export default function SelectInputs() {
  const options = [
    { value: "marketing", label: "Marketinq" },
    { value: "template", label: "Şablon" },
    { value: "development", label: "İnkişaf" },
  ];

  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };

  const multiOptions = [
    { value: "1", text: "Seçim 1", selected: false },
    { value: "2", text: "Seçim 2", selected: false },
    { value: "3", text: "Seçim 3", selected: false },
    { value: "4", text: "Seçim 4", selected: false },
    { value: "5", text: "Seçim 5", selected: false },
  ];

  return (
    <ComponentCard title="Seçim Daxiletmələri">
      <div className="space-y-6">
        <div>
          <Label>Seçim daxiletməsi</Label>
         <div className="relative">
           <Select
            options={options}
            placeholder="Seçim edin"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon/>
            </span>
         </div>
        </div>
        <div className="relative">
          <MultiSelect
            label="Çoxlu seçim variantları"
            options={multiOptions}
            defaultSelected={["1", "3"]}
            onChange={(values) => setSelectedValues(values)}
          />
          <p className="sr-only">
            Seçilmiş Dəyərlər: {selectedValues.join(", ")}
          </p>
        </div>
      </div>
    </ComponentCard>
  );
}
